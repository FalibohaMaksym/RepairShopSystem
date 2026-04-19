package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.ConfirmRepairRequest;
import org.nulp.backend.dto.request.CreateOrderRequest;
import org.nulp.backend.dto.request.CreateRepairServiceRequest;
import org.nulp.backend.dto.response.RepairListItemResponse;
import org.nulp.backend.dto.response.ActiveOrderResponse;
import org.nulp.backend.dto.response.ArchiveOrderResponse;
import org.nulp.backend.dto.response.AvailableOrderResponse;
import org.nulp.backend.dto.response.OrderAvailableServiceResponse;
import org.nulp.backend.dto.response.OrderChildrenResponse;
import org.nulp.backend.dto.response.OrderDetailResponse;
import org.nulp.backend.dto.response.OrderResponse;
import org.nulp.backend.dto.response.RepairResponse;
import org.nulp.backend.entity.*;
import org.nulp.backend.exception.ForbiddenException;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.*;
import org.nulp.backend.repository.DiagnosticRepository;
import org.nulp.backend.repository.RepairPriorityRepository;
import org.nulp.backend.repository.RepairStatusRepository;
import org.nulp.backend.repository.RepairRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final JpaOrderRepository jpaOrderRepository;
    private final WorkerRepository workerRepository;
    private final OrderStatusRepository orderStatusRepository;
    private final CustomerDeviceRepository customerDeviceRepository;
    private final PdfService pdfService;
    private final DiagnosticRepository diagnosticRepository;
    private final RepairRepository repairRepository;
    private final RepairPriorityRepository repairPriorityRepository;
    private final RepairStatusRepository repairStatusRepository;
    private final RepairQueryService repairQueryService;
    private final ServiceRepository serviceRepository;

    public List<OrderAvailableServiceResponse> getAllServicesForOrder(String orderNumber) {
        if (!jpaOrderRepository.existsByOrderNumber(orderNumber)) {
            throw new ResourceNotFoundException("Order not found: " + orderNumber);
        }

        return serviceRepository.findAllByOrderNumberDeviceType(orderNumber).stream()
                .map(this::toOrderAvailableServiceResponse)
                .toList();
    }

    public OrderDetailResponse getByOrderNumber(String orderNumber) {
        return jpaOrderRepository.findByOrderNumberWithDetails(orderNumber)
                .map(this::toDetailResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
    }

    public OrderChildrenResponse checkChildren(String orderNumber) {
        if (!jpaOrderRepository.existsByOrderNumber(orderNumber)) {
            throw new ResourceNotFoundException("Order not found: " + orderNumber);
        }
        return new OrderChildrenResponse(
                diagnosticRepository.existsByOrderOrderNumber(orderNumber),
                repairRepository.existsByOrderOrderNumber(orderNumber)
        );
    }

    public byte[] generateTicket(String orderNumber) {
        OrderDetailResponse order = jpaOrderRepository.findByOrderNumberWithDetails(orderNumber)
                .map(this::toDetailResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        if (!"нове".equals(order.orderStatus())) {
            throw new ForbiddenException("Ticket can only be generated for orders with status 'нове'");
        }

        return pdfService.generateRepairTicket(order);
    }

    public List<AvailableOrderResponse> getAvailableOrdersForWorker(Integer workerId) {
        return orderRepository.findAvailableOrdersForWorker(workerId);
    }

    public List<OrderDetailResponse> getInProgressOrdersForWorker(Integer workerId) {
        return jpaOrderRepository.findInProgressByWorker(workerId).stream()
                .map(this::toDetailResponse)
                .toList();
    }

    public List<ActiveOrderResponse> getActiveOrdersForWorkerBranch(Integer workerId) {
        Worker worker = workerRepository.findByIdWithBranch(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        if (worker.getBranch() == null) {
            throw new ResourceNotFoundException("Worker has no branch assigned");
        }

        return orderRepository.findActiveOrdersByBranch(worker.getBranch().getId());
    }

    public List<ArchiveOrderResponse> getArchivedOrdersForWorkerBranch(Integer workerId) {
        Worker worker = workerRepository.findByIdWithBranch(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        Integer branchId = worker.getBranch() != null ? worker.getBranch().getId() : null;
        return orderRepository.findArchivedOrdersByBranch(branchId);
    }

    @Transactional
    public void completeOrder(String orderNumber) {
        Order order = jpaOrderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        String currentStatus = order.getOrderStatus() != null
                ? order.getOrderStatus().getOrderStatusName() : null;
        if (!"до отримання".equals(currentStatus)) {
            throw new ForbiddenException(
                    "Order must be in 'до отримання' status, current: " + currentStatus);
        }

        OrderStatus completed = orderStatusRepository.findByOrderStatusName("виконано")
                .orElseThrow(() -> new ResourceNotFoundException("OrderStatus 'виконано' not found"));
        order.setOrderStatus(completed);
        jpaOrderRepository.save(order);
    }

    @Transactional
    public void declineOrder(String orderNumber) {
        Order order = jpaOrderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        String currentStatus = order.getOrderStatus() != null
                ? order.getOrderStatus().getOrderStatusName() : null;
        if (!"очікує підтвердження".equals(currentStatus)) {
            throw new ForbiddenException(
                    "Order must be in 'очікує підтвердження' status, current: " + currentStatus);
        }

        OrderStatus declined = orderStatusRepository.findByOrderStatusName("відмовлено")
                .orElseThrow(() -> new ResourceNotFoundException("OrderStatus 'відмовлено' not found"));
        order.setOrderStatus(declined);
        jpaOrderRepository.save(order);
    }

    @Transactional
    public List<RepairResponse> confirmRepairs(String orderNumber, ConfirmRepairRequest request) {
        Order order = jpaOrderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        String currentStatus = order.getOrderStatus() != null
                ? order.getOrderStatus().getOrderStatusName() : null;
        if (!"очікує підтвердження".equals(currentStatus)) {
            throw new ForbiddenException(
                    "Order must be in 'очікує підтвердження' status, current: " + currentStatus);
        }

        RepairStatus waitingStatus = repairStatusRepository.findByRepairStatusName("очікування майстра")
                .orElseThrow(() -> new ResourceNotFoundException("RepairStatus 'очікування майстра' not found"));

        Worker worker = workerRepository.findByIdWithBranch(order.getWorker().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found"));
        Branch workerBranch = worker.getBranch();

        List<RepairResponse> result = request.repairs().stream()
                .map(item -> {
                    RepairPriority priority = repairPriorityRepository.findById(item.priorityId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "RepairPriority not found: " + item.priorityId()));
                    Repair repair = new Repair();
                    repair.setOrder(order);
                    repair.setRepairPriority(priority);
                    repair.setRepairStatus(waitingStatus);
                    Repair saved = repairRepository.save(repair);

                    List<RepairListItemResponse.ServiceItem> serviceItems = List.of();
                    if (item.services() != null && !item.services().isEmpty()) {
                        serviceItems = item.services().stream()
                                .map(svc -> {
                                    List<CreateRepairServiceRequest.ComponentItem> components =
                                            svc.components() == null ? List.of() :
                                            svc.components().stream()
                                                    .map(c -> new CreateRepairServiceRequest.ComponentItem(
                                                            c.componentId(), c.quantity()))
                                                    .toList();
                                    CreateRepairServiceRequest svcReq =
                                            new CreateRepairServiceRequest(
                                                    svc.workerServiceId(), svc.serviceId(), components);
                                    return repairQueryService.planService(
                                            saved.getId(), orderNumber, svcReq, workerBranch);
                                })
                                .toList();
                    }

                    return new RepairResponse(saved.getId(), priority.getRepairPriorityValue(), serviceItems);
                })
                .toList();

        // Тригер trg_OrderAutoSet змінює статус лише якщо RepairStartedAt IS NOT NULL.
        // При INSERT з RepairStartedAt = NULL тригер не спрацьовує —
        // тому статус змінюємо вручну щоб замовлення потрапило до SP підбору завдань.
        OrderStatus waitingRepair = orderStatusRepository.findByOrderStatusName("очікує ремонт")
                .orElseThrow(() -> new ResourceNotFoundException("OrderStatus 'очікує ремонт' not found"));
        order.setOrderStatus(waitingRepair);
        jpaOrderRepository.save(order);

        return result;
    }

    @Transactional
    public void deleteOrder(String orderNumber) {
        Order order = jpaOrderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        String currentStatus = order.getOrderStatus() != null
                ? order.getOrderStatus().getOrderStatusName() : null;
        if (!"нове".equals(currentStatus)) {
            throw new ForbiddenException("Замовлення можна видалити лише зі статусом 'нове'");
        }

        if (order.getOrderCreationTime() == null ||
                order.getOrderCreationTime().isBefore(LocalDateTime.now().minusHours(1))) {
            throw new ForbiddenException("Замовлення можна видалити лише впродовж години після створення");
        }

        jpaOrderRepository.delete(order);
    }

    @Transactional
    public OrderResponse create(CreateOrderRequest request) {
        Worker worker = workerRepository.findById(request.workerId())
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + request.workerId()));

        // Статус "нове" встановлюється автоматично при створенні замовлення.
        // Подальші зміни статусу виконуються тригерами БД при роботі з діагностикою та ремонтом.
        OrderStatus newStatus = orderStatusRepository.findByOrderStatusName("нове")
                .orElseThrow(() -> new ResourceNotFoundException("OrderStatus 'нове' not found in DB"));

        CustomerDevice customerDevice = customerDeviceRepository.findByIdWithDetails(request.customerDeviceId())
                .orElseThrow(() -> new ResourceNotFoundException("CustomerDevice not found: " + request.customerDeviceId()));

        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setOrderCreationTime(LocalDateTime.now());
        // OrderEstimatedPrice не встановлюється — розраховується тригерами БД
        // при додаванні/зміні ремонтних послуг та використаних комплектуючих
        order.setProblemDescription(request.problemDescription());
        order.setWorker(worker);
        order.setOrderStatus(newStatus);
        order.setCustomerDevice(customerDevice);

        return toResponse(jpaOrderRepository.save(order));
    }

    private String generateOrderNumber() {
        String maxNumber = jpaOrderRepository.findMaxOrderNumber().orElse("OR00000000");
        long next = Long.parseLong(maxNumber.substring(2)) + 1;
        return String.format("OR%08d", next);
    }

    private OrderDetailResponse toDetailResponse(Order o) {
        Worker w = o.getWorker();
        CustomerDevice cd = o.getCustomerDevice();
        Customer customer = cd != null ? cd.getCustomer() : null;
        Device device = cd != null ? cd.getDevice() : null;

        return new OrderDetailResponse(
                o.getId(),
                o.getOrderNumber(),
                o.getOrderStatus() != null ? o.getOrderStatus().getOrderStatusName() : null,
                o.getOrderEstimatedPrice(),
                o.getOrderCreationTime(),
                o.getProblemDescription(),

                w != null ? w.getId() : null,
                w != null ? w.getWorkerFullName() : null,
                w != null ? w.getWorkerPhoneNumber() : null,
                w != null ? w.getWorkerEmail() : null,
                w != null && w.getBranch() != null ? w.getBranch().getBranchAddress() : null,

                customer != null ? customer.getId() : null,
                customer != null ? customer.getFullName() : null,
                customer != null ? customer.getPhoneNumber() : null,
                customer != null ? customer.getEmail() : null,

                cd != null ? cd.getId() : null,
                cd != null ? cd.getDeviceSerialNumber() : null,
                cd != null ? cd.getExternalConditionDescription() : null,
                cd != null ? cd.getDeviceAdditionalInfo() : null,

                device != null ? device.getId() : null,
                device != null ? device.getDeviceModel() : null,
                device != null && device.getDeviceType() != null ? device.getDeviceType().getDeviceTypeName() : null,
                device != null && device.getProducer() != null ? device.getProducer().getProducerCompanyName() : null
        );
    }

    private OrderResponse toResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getOrderStatus() != null ? order.getOrderStatus().getOrderStatusName() : null,
                order.getOrderEstimatedPrice(),
                order.getOrderCreationTime(),
                order.getProblemDescription(),
                order.getWorker() != null ? order.getWorker().getWorkerFullName() : null,
                order.getCustomerDevice() != null ? order.getCustomerDevice().getDevice().getDeviceModel() : null,
                order.getCustomerDevice() != null ? order.getCustomerDevice().getDeviceSerialNumber() : null,
                order.getCustomerDevice() != null && order.getCustomerDevice().getCustomer() != null
                        ? order.getCustomerDevice().getCustomer().getFullName() : null
        );
    }

    private OrderAvailableServiceResponse toOrderAvailableServiceResponse(org.nulp.backend.entity.Service service) {
        return new OrderAvailableServiceResponse(
                service.getId(),
                service.getServiceName(),
                service.getServiceEstimatedPrice(),
                service.getServiceCategory() != null ? service.getServiceCategory().getServiceCategoryName() : null,
                service.getServiceComplexity() != null ? service.getServiceComplexity().getServiceComplexityValue() : null,
                service.getDeviceType() != null ? service.getDeviceType().getDeviceTypeName() : null
        );
    }
}
