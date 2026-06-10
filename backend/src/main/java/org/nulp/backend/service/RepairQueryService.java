package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateRepairServiceRequest;
import org.nulp.backend.dto.response.RepairListItemResponse;
import org.nulp.backend.entity.*;
import org.nulp.backend.exception.ConflictException;
import org.nulp.backend.exception.ForbiddenException;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.BranchStockRepository;
import org.nulp.backend.repository.ComponentRepository;
import org.nulp.backend.repository.JpaOrderRepository;
import org.nulp.backend.repository.OrderStatusRepository;
import org.nulp.backend.repository.RepairRepository;
import org.nulp.backend.repository.RepairServiceRepository;
import org.nulp.backend.repository.RepairStatusRepository;
import org.nulp.backend.repository.RequiredComponentRepository;
import org.nulp.backend.repository.ServiceRepository;
import org.nulp.backend.repository.WorkerServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RepairQueryService {

    private final RepairRepository repairRepository;
    private final RepairServiceRepository repairServiceRepository;
    private final RequiredComponentRepository requiredComponentRepository;
    private final WorkerServiceRepository workerServiceRepository;
    private final BranchStockRepository branchStockRepository;
    private final ComponentRepository componentRepository;
    private final RepairStatusRepository repairStatusRepository;
    private final ServiceRepository serviceRepository;
    private final JpaOrderRepository jpaOrderRepository;
    private final OrderStatusRepository orderStatusRepository;

    @Transactional
    public RepairListItemResponse.ServiceItem planService(
            Integer repairId,
            String orderNumber,
            CreateRepairServiceRequest request,
            Branch workerBranch) {

        Repair repair = repairRepository.findById(repairId)
                .orElseThrow(() -> new ResourceNotFoundException("Repair not found: " + repairId));

        if (!repair.getOrder().getOrderNumber().equals(orderNumber)) {
            throw new ResourceNotFoundException("Repair " + repairId + " does not belong to order " + orderNumber);
        }

        WorkerService workerService = resolveWorkerService(request);

        RepairService rs = new RepairService();
        rs.setRepair(repair);
        rs.setWorkerService(workerService);
        RepairService saved = repairServiceRepository.save(rs);

        List<RepairListItemResponse.ComponentItem> componentItems = List.of();
        if (request.components() != null && !request.components().isEmpty()) {
            componentItems = request.components().stream()
                    .map(item -> {
                        BranchStock stock = branchStockRepository
                                .findByBranchIdAndComponentId(workerBranch.getId(), item.componentId())
                                .orElseGet(() -> {
                                    Component component = componentRepository.findById(item.componentId())
                                            .orElseThrow(() -> new ResourceNotFoundException(
                                                    "Component not found: " + item.componentId()));
                                    BranchStock newStock = new BranchStock();
                                    newStock.setBranch(workerBranch);
                                    newStock.setComponent(component);
                                    newStock.setCurrentQuantity(0);
                                    newStock.setCreateDatetime(LocalDateTime.now());
                                    return branchStockRepository.save(newStock);
                                });

                        RequiredComponent rc = new RequiredComponent();
                        rc.setRepairService(saved);
                        rc.setBranchStock(stock);
                        rc.setComponentAmount(item.quantity().shortValue());
                        requiredComponentRepository.save(rc);

                        Component c = stock.getComponent();
                        return new RepairListItemResponse.ComponentItem(
                                c.getId(),
                                c.getComponentModel(),
                                c.getProducer() != null ? c.getProducer().getProducerCompanyName() : null,
                                c.getComponentCategory() != null ? c.getComponentCategory().getComponentCategoryName() : null,
                                c.getComponentPrice(),
                                item.quantity().shortValue(),
                                stock.getCurrentQuantity()
                        );
                    })
                    .toList();
        }

        var ws = workerService;
        return new RepairListItemResponse.ServiceItem(
                saved.getId(),
                ws.getService() != null ? ws.getService().getServiceName() : null,
                ws.getWorker() != null ? ws.getWorker().getWorkerFullName() : null,
                saved.getRepairServiceStartedAt(),
                saved.getRepairServiceFinishedAt(),
                componentItems
        );
    }

    @Transactional
    public RepairListItemResponse.ServiceItem updateService(
            Integer serviceId,
            Integer repairId,
            String orderNumber,
            CreateRepairServiceRequest request,
            Branch workerBranch) {

        RepairService rs = repairServiceRepository.findByIdAndContext(serviceId, repairId, orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("RepairService not found"));

        if (rs.getRepairServiceStartedAt() != null) {
            throw new ConflictException("Cannot edit a service that has already started");
        }

        WorkerService workerService = resolveWorkerService(request);

        rs.setWorkerService(workerService);
        repairServiceRepository.save(rs);

        requiredComponentRepository.deleteByRepairServiceId(rs.getId());

        List<RepairListItemResponse.ComponentItem> componentItems = List.of();
        if (request.components() != null && !request.components().isEmpty()) {
            componentItems = request.components().stream()
                    .map(item -> {
                        BranchStock stock = branchStockRepository
                                .findByBranchIdAndComponentId(workerBranch.getId(), item.componentId())
                                .orElseGet(() -> {
                                    Component component = componentRepository.findById(item.componentId())
                                            .orElseThrow(() -> new ResourceNotFoundException(
                                                    "Component not found: " + item.componentId()));
                                    BranchStock newStock = new BranchStock();
                                    newStock.setBranch(workerBranch);
                                    newStock.setComponent(component);
                                    newStock.setCurrentQuantity(0);
                                    newStock.setCreateDatetime(LocalDateTime.now());
                                    return branchStockRepository.save(newStock);
                                });

                        RequiredComponent rc = new RequiredComponent();
                        rc.setRepairService(rs);
                        rc.setBranchStock(stock);
                        rc.setComponentAmount(item.quantity().shortValue());
                        requiredComponentRepository.save(rc);

                        Component c = stock.getComponent();
                        return new RepairListItemResponse.ComponentItem(
                                c.getId(),
                                c.getComponentModel(),
                                c.getProducer() != null ? c.getProducer().getProducerCompanyName() : null,
                                c.getComponentCategory() != null ? c.getComponentCategory().getComponentCategoryName() : null,
                                c.getComponentPrice(),
                                item.quantity().shortValue(),
                                stock.getCurrentQuantity()
                        );
                    })
                    .toList();
        }

        return toServiceItem(rs, componentItems);
    }

    @Transactional
    public RepairListItemResponse.ServiceItem startService(Integer serviceId, Integer repairId, String orderNumber, Integer currentWorkerId) {
        RepairService rs = repairServiceRepository.findByIdAndContext(serviceId, repairId, orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("RepairService not found"));

        if (rs.getRepairServiceStartedAt() != null) {
            throw new ConflictException("Service already started");
        }

        WorkerService ws = rs.getWorkerService();
        if (ws != null) {
            if (ws.getWorker() != null) {
                // Послуга призначена конкретному майстру — перевіряємо збіг
                if (!ws.getWorker().getId().equals(currentWorkerId)) {
                    throw new ForbiddenException("Цю послугу призначено іншому майстру");
                }
            } else {
                // Послуга без майстра — перевіряємо чи є у поточного WorkerService для цієї послуги
                Integer serviceEntityId = ws.getService() != null ? ws.getService().getId() : null;
                WorkerService workerWs = workerServiceRepository
                        .findByWorkerIdAndServiceId(currentWorkerId, serviceEntityId)
                        .orElseThrow(() -> new ForbiddenException(
                                "У вас немає компетенції для проведення цієї послуги"));
                // Призначаємо реальний WorkerService поточного майстра
                rs.setWorkerService(workerWs);
                repairServiceRepository.save(rs);
            }
        }

        rs.setRepairServiceStartedAt(LocalDateTime.now());

        try {
            repairServiceRepository.saveAndFlush(rs);
        } catch (Exception ex) {
            Throwable cause = ex;
            while (cause.getCause() != null) cause = cause.getCause();
            String msg = cause.getMessage();
            throw new ConflictException(msg != null ? msg : "Failed to start service: insufficient stock");
        }

        List<RepairListItemResponse.ComponentItem> components =
                requiredComponentRepository.findByRepairServiceIdWithDetails(rs.getId()).stream()
                        .map(this::toComponentItem)
                        .toList();

        Repair repair = repairRepository.findById(repairId)
                .orElseThrow(() -> new ResourceNotFoundException("Repair not found"));

        if (repair.getRepairStartedAt() == null) {
            repair.setRepairStartedAt(LocalDateTime.now());
            RepairStatus inWorkStatus = repairStatusRepository.findByRepairStatusName("в роботі")
                    .orElseThrow(() -> new ResourceNotFoundException("RepairStatus 'в роботі' not found"));
            repair.setRepairStatus(inWorkStatus);
            repairRepository.save(repair);
        }

        // Якщо замовлення очікувало ремонту — переводимо в "в ремонті"
        Order order = repair.getOrder();
        if ("очікує ремонт".equals(
                order.getOrderStatus() != null ? order.getOrderStatus().getOrderStatusName() : null)) {
            OrderStatus inRepairStatus = orderStatusRepository.findByOrderStatusName("в ремонті")
                    .orElseThrow(() -> new ResourceNotFoundException("OrderStatus 'в ремонті' not found"));
            order.setOrderStatus(inRepairStatus);
            jpaOrderRepository.save(order);
        }

        return toServiceItem(rs, components);
    }

    @Transactional
    public RepairListItemResponse pauseRepair(Integer repairId, String orderNumber) {
        Repair repair = repairRepository.findByIdAndOrderNumber(repairId, orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Repair not found"));

        if (repair.getRepairStartedAt() == null) {
            throw new ConflictException("Ремонт ще не розпочато");
        }
        if (repair.getRepairFinishedAt() != null) {
            throw new ConflictException("Ремонт вже завершено");
        }
        if (repairServiceRepository.existsByRepairIdAndRepairServiceStartedAtIsNotNullAndRepairServiceFinishedAtIsNull(repairId)) {
            throw new ConflictException("Неможливо призупинити ремонт: є послуги, що ще тривають");
        }

        RepairStatus waitingStatus = repairStatusRepository.findByRepairStatusName("очікування майстра")
                .orElseThrow(() -> new ResourceNotFoundException("RepairStatus 'очікування майстра' not found"));

        repair.setRepairStatus(waitingStatus);
        repairRepository.save(repair);

        // Change order status to "очікує ремонт" if no other repair of this order is still "в роботі"
        boolean anyRepairInWork = repairRepository
                .existsByOrderOrderNumberAndRepairStatusRepairStatusName(orderNumber, "в роботі");
        if (!anyRepairInWork) {
            Order order = repair.getOrder();
            OrderStatus waitingRepairStatus = orderStatusRepository.findByOrderStatusName("очікує ремонт")
                    .orElseThrow(() -> new ResourceNotFoundException("OrderStatus 'очікує ремонт' not found"));
            order.setOrderStatus(waitingRepairStatus);
            jpaOrderRepository.save(order);
        }

        return toRepairItem(repair);
    }

    @Transactional
    public RepairListItemResponse finishRepair(Integer repairId, String orderNumber) {
        Repair repair = repairRepository.findByIdAndOrderNumber(repairId, orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Repair not found"));

        if (repair.getRepairStartedAt() == null) {
            throw new ConflictException("Cannot finish a repair that has not started yet");
        }
        if (repair.getRepairFinishedAt() != null) {
            throw new ConflictException("Repair already finished");
        }
        if (repairServiceRepository.existsByRepairIdAndRepairServiceStartedAtIsNotNullAndRepairServiceFinishedAtIsNull(repairId)) {
            throw new ConflictException("Неможливо завершити ремонт: є послуги, що ще тривають");
        }

        RepairStatus doneStatus = repairStatusRepository.findByRepairStatusName("виконано")
                .orElseThrow(() -> new ResourceNotFoundException("RepairStatus 'виконано' not found"));

        repair.setRepairFinishedAt(LocalDateTime.now());
        repair.setRepairStatus(doneStatus);
        repairRepository.save(repair);

        return toRepairItem(repair);
    }

    @Transactional
    public RepairListItemResponse.ServiceItem finishService(Integer serviceId, Integer repairId, String orderNumber) {
        RepairService rs = repairServiceRepository.findByIdAndContext(serviceId, repairId, orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("RepairService not found"));

        if (rs.getRepairServiceStartedAt() == null) {
            throw new ConflictException("Cannot finish a service that has not started yet");
        }
        if (rs.getRepairServiceFinishedAt() != null) {
            throw new ConflictException("Service already finished");
        }

        rs.setRepairServiceFinishedAt(LocalDateTime.now());
        repairServiceRepository.save(rs);

        List<RepairListItemResponse.ComponentItem> components =
                requiredComponentRepository.findByRepairServiceIdWithDetails(rs.getId()).stream()
                        .map(this::toComponentItem)
                        .toList();

        // Перевіряємо чи треба змінити статус замовлення на "очікує ремонт":
        // умова: немає послуг що тривають, немає запланованих з майстром,
        //        але є заплановані без майстра (нікому продовжувати роботу)
        boolean hasInProgress = repairServiceRepository
                .existsByRepairIdAndRepairServiceStartedAtIsNotNullAndRepairServiceFinishedAtIsNull(repairId);
        boolean hasAssignedPlanned = repairServiceRepository
                .existsByRepairIdAndRepairServiceStartedAtIsNullAndWorkerServiceWorkerIsNotNull(repairId);
        boolean hasUnassignedPlanned = repairServiceRepository
                .existsByRepairIdAndRepairServiceStartedAtIsNullAndWorkerServiceWorkerIsNull(repairId);

        if (!hasInProgress && !hasAssignedPlanned && hasUnassignedPlanned) {
            Repair repair = repairRepository.findById(repairId)
                    .orElseThrow(() -> new ResourceNotFoundException("Repair not found"));
            Order order = repair.getOrder();
            OrderStatus waitingRepairStatus = orderStatusRepository.findByOrderStatusName("очікує ремонт")
                    .orElseThrow(() -> new ResourceNotFoundException("OrderStatus 'очікує ремонт' not found"));
            order.setOrderStatus(waitingRepairStatus);
            jpaOrderRepository.save(order);
        }

        return toServiceItem(rs, components);
    }

    @Transactional(readOnly = true)
    public List<RepairListItemResponse> getRepairsByOrderNumber(String orderNumber) {
        return repairRepository.findByOrderNumberWithDetails(orderNumber).stream()
                .map(this::toRepairItem)
                .toList();
    }

    /**
     * Повертає WorkerService за workerServiceId або serviceId.
     * Якщо передано serviceId — шукає або створює WorkerService з worker = null
     * (послуга запланована без призначеного майстра).
     */
    private WorkerService resolveWorkerService(CreateRepairServiceRequest request) {
        if (request.workerServiceId() != null) {
            return workerServiceRepository.findByIdWithDetails(request.workerServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "WorkerService not found: " + request.workerServiceId()));
        }
        if (request.serviceId() != null) {
            return workerServiceRepository.findUnassignedByServiceId(request.serviceId())
                    .orElseGet(() -> {
                        org.nulp.backend.entity.Service service = serviceRepository.findById(request.serviceId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                        "Service not found: " + request.serviceId()));
                        WorkerService ws = new WorkerService();
                        ws.setWorker(null);
                        ws.setService(service);
                        ws.setCreateDatetime(java.time.LocalDateTime.now());
                        return workerServiceRepository.save(ws);
                    });
        }
        throw new ConflictException("Either workerServiceId or serviceId must be provided");
    }

    private RepairListItemResponse toRepairItem(Repair repair) {
        List<RepairListItemResponse.ServiceItem> services =
                repairServiceRepository.findByRepairIdWithDetails(repair.getId()).stream()
                        .map(this::toServiceItem)
                        .toList();

        return new RepairListItemResponse(
                repair.getId(),
                repair.getRepairStatus() != null ? repair.getRepairStatus().getRepairStatusName() : null,
                repair.getRepairPriority() != null ? repair.getRepairPriority().getId() : null,
                repair.getRepairPriority() != null ? repair.getRepairPriority().getRepairPriorityValue() : null,
                repair.getRepairStartedAt(),
                repair.getRepairFinishedAt(),
                services
        );
    }

    private RepairListItemResponse.ServiceItem toServiceItem(RepairService rs) {
        List<RepairListItemResponse.ComponentItem> components =
                requiredComponentRepository.findByRepairServiceIdWithDetails(rs.getId()).stream()
                        .map(this::toComponentItem)
                        .toList();
        return toServiceItem(rs, components);
    }

    private RepairListItemResponse.ServiceItem toServiceItem(
            RepairService rs,
            List<RepairListItemResponse.ComponentItem> components) {
        WorkerService ws = rs.getWorkerService();
        return new RepairListItemResponse.ServiceItem(
                rs.getId(),
                ws != null && ws.getService() != null ? ws.getService().getServiceName() : null,
                ws != null && ws.getWorker() != null ? ws.getWorker().getWorkerFullName() : null,
                rs.getRepairServiceStartedAt(),
                rs.getRepairServiceFinishedAt(),
                components
        );
    }

    private RepairListItemResponse.ComponentItem toComponentItem(RequiredComponent rc) {
        BranchStock bs = rc.getBranchStock();
        Component c = bs != null ? bs.getComponent() : null;

        return new RepairListItemResponse.ComponentItem(
                c != null ? c.getId() : null,
                c != null ? c.getComponentModel() : null,
                c != null && c.getProducer() != null ? c.getProducer().getProducerCompanyName() : null,
                c != null && c.getComponentCategory() != null ? c.getComponentCategory().getComponentCategoryName() : null,
                c != null ? c.getComponentPrice() : null,
                rc.getComponentAmount(),
                bs != null ? bs.getCurrentQuantity() : null
        );
    }
}
