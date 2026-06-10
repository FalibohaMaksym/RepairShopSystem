package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateComponentOrderRequest;
import org.nulp.backend.dto.request.CreateSupplyRequest;
import org.nulp.backend.dto.request.UpdateComponentOrderRequest;
import org.nulp.backend.exception.ConflictException;
import org.nulp.backend.dto.response.ActiveComponentOrderResponse;
import org.nulp.backend.dto.response.ComponentOrderDetailResponse;
import org.nulp.backend.dto.response.ComponentOrderResponse;
import org.nulp.backend.dto.response.SupplyResponse;
import org.nulp.backend.entity.Branch;
import org.nulp.backend.entity.BranchStock;
import org.nulp.backend.entity.Component;
import org.nulp.backend.entity.ComponentOrder;
import org.nulp.backend.entity.ComponentOrderStatus;
import org.nulp.backend.entity.ItemInComponentOrder;
import org.nulp.backend.entity.ItemInSupply;
import org.nulp.backend.entity.Supply;
import org.nulp.backend.entity.Supplier;
import org.nulp.backend.entity.Worker;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.BranchRepository;
import org.nulp.backend.repository.BranchStockRepository;
import org.nulp.backend.repository.ComponentOrderRepository;
import org.nulp.backend.repository.ComponentOrderStatusRepository;
import org.nulp.backend.repository.ComponentRepository;
import org.nulp.backend.repository.ItemInComponentOrderRepository;
import org.nulp.backend.repository.ItemInSupplyRepository;
import org.nulp.backend.repository.SupplierRepository;
import org.nulp.backend.repository.SupplyRepository;
import org.nulp.backend.repository.WorkerRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComponentOrderService {

    private final ComponentOrderRepository componentOrderRepository;
    private final ComponentOrderStatusRepository componentOrderStatusRepository;
    private final ItemInComponentOrderRepository itemInComponentOrderRepository;
    private final ItemInSupplyRepository itemInSupplyRepository;
    private final ComponentRepository componentRepository;
    private final SupplierRepository supplierRepository;
    private final SupplyRepository supplyRepository;
    private final WorkerRepository workerRepository;
    private final BranchStockRepository branchStockRepository;
    private final BranchRepository branchRepository;
    private final JdbcTemplate jdbcTemplate;

    public List<ActiveComponentOrderResponse> getActive() {
        // Ключ: orderNumber — зберігаємо порядок як у SP (LinkedHashMap)
        Map<String, ActiveComponentOrderResponse> grouped = new LinkedHashMap<>();

        jdbcTemplate.query("EXEC dbo.usp_GetActiveComponentOrders", rs -> {
            Integer orderId = rs.getInt("ComponentOrderPK");
            String orderNumber = rs.getString("OrderNumber");
            LocalDate orderDate = toLocalDate(rs.getDate("OrderDate"));
            BigDecimal orderSum = rs.getBigDecimal("OrderSum");
            LocalDate expectedExecutionDate = toLocalDate(rs.getDate("ExpectedExecutionDate"));
            String status = rs.getString("Status");

            ActiveComponentOrderResponse.ComponentItem item = new ActiveComponentOrderResponse.ComponentItem(
                    rs.getString("ComponentModel"),
                    rs.getString("ComponentCategory"),
                    rs.getString("Producer"),
                    rs.getInt("OrderedQuantity"),
                    rs.getInt("SuppliedQuantity")
            );

            grouped.compute(orderId.toString(), (key, existing) -> {
                if (existing == null) {
                    List<ActiveComponentOrderResponse.ComponentItem> items = new ArrayList<>();
                    items.add(item);
                    return new ActiveComponentOrderResponse(orderId, orderNumber, orderDate, orderSum, expectedExecutionDate, status, items);
                } else {
                    existing.items().add(item);
                    return existing;
                }
            });
        });

        return new ArrayList<>(grouped.values());
    }

    @Transactional
    public ComponentOrderResponse create(CreateComponentOrderRequest request, Integer workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + request.supplierId()));

        ComponentOrderStatus status = componentOrderStatusRepository
                .findByComponentOrderStatusName("замовлено")
                .orElseThrow(() -> new ResourceNotFoundException("Status 'замовлено' not found"));

        String orderNumber = generateOrderNumber();

        BigDecimal estimatedSum = request.items().stream()
                .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        ComponentOrder order = new ComponentOrder();
        order.setComponentOrderNumber(orderNumber);
        order.setComponentOrderCreatedAt(LocalDate.now());
        order.setExpectedExecutionDate(request.expectedExecutionDate());
        order.setEstimatedOrderSum(estimatedSum);
        order.setSupplier(supplier);
        order.setWorker(worker);
        order.setComponentOrderStatus(status);
        LocalDateTime now = LocalDateTime.now();
        order.setCreateDatetime(now);

        ComponentOrder saved = componentOrderRepository.saveAndFlush(order);
        // Якщо БД повернула null (дефолт не проксується назад через Hibernate) — виставляємо вручну
        if (saved.getCreateDatetime() == null) {
            saved.setCreateDatetime(now);
        }

        List<ComponentOrderResponse.ItemResponse> itemResponses = new ArrayList<>();
        for (CreateComponentOrderRequest.OrderItem itemReq : request.items()) {
            Component component = componentRepository.findById(itemReq.componentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Component not found: " + itemReq.componentId()));

            ItemInComponentOrder item = new ItemInComponentOrder();
            item.setComponentOrder(saved);
            item.setComponent(component);
            item.setItemsQuantity(itemReq.quantity());
            item.setUnitPrice(itemReq.unitPrice());
            item.setCreateDatetime(LocalDateTime.now());

            ItemInComponentOrder savedItem = itemInComponentOrderRepository.save(item);
            itemResponses.add(new ComponentOrderResponse.ItemResponse(
                    savedItem.getId(),
                    component.getId(),
                    component.getComponentModel(),
                    itemReq.quantity(),
                    itemReq.unitPrice()
            ));
        }

        return new ComponentOrderResponse(
                saved.getId(),
                saved.getComponentOrderNumber(),
                saved.getComponentOrderCreatedAt(),
                saved.getExpectedExecutionDate(),
                saved.getEstimatedOrderSum(),
                status.getComponentOrderStatusName(),
                supplier.getCompanyName(),
                itemResponses
        );
    }

    // ── Видалення замовлення ─────────────────────────────────────────────────

    @Transactional
    public void deleteOrder(Integer orderId) {
        ComponentOrder order = componentOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("ComponentOrder not found: " + orderId));

        if (itemInSupplyRepository.existsByItemInComponentOrder_ComponentOrder_Id(orderId)) {
            throw new ConflictException("Неможливо видалити замовлення: по ньому вже зареєстровано поставку");
        }

        if (order.getCreateDatetime() == null ||
                order.getCreateDatetime().isBefore(LocalDateTime.now().minusHours(1))) {
            throw new ConflictException("Неможливо видалити замовлення: минула 1 година з моменту створення");
        }

        itemInComponentOrderRepository.deleteAll(
                itemInComponentOrderRepository.findByComponentOrderIdWithDetails(orderId));
        componentOrderRepository.delete(order);
    }

    // ── Оновлення замовлення ─────────────────────────────────────────────────

    @Transactional
    public ComponentOrderResponse updateOrder(Integer orderId, UpdateComponentOrderRequest request) {
        ComponentOrder order = componentOrderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("ComponentOrder not found: " + orderId));

        if (itemInSupplyRepository.existsByItemInComponentOrder_ComponentOrder_Id(orderId)) {
            throw new ConflictException("Неможливо редагувати замовлення: по ньому вже зареєстровано поставку");
        }

        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + request.supplierId()));

        // Видаляємо старі позиції та створюємо нові
        List<ItemInComponentOrder> oldItems =
                itemInComponentOrderRepository.findByComponentOrderIdWithDetails(orderId);
        itemInComponentOrderRepository.deleteAll(oldItems);

        BigDecimal estimatedSum = request.items().stream()
                .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setSupplier(supplier);
        order.setExpectedExecutionDate(request.expectedExecutionDate());
        order.setEstimatedOrderSum(estimatedSum);
        componentOrderRepository.save(order);

        List<ComponentOrderResponse.ItemResponse> itemResponses = new ArrayList<>();
        for (UpdateComponentOrderRequest.OrderItem itemReq : request.items()) {
            Component component = componentRepository.findById(itemReq.componentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Component not found: " + itemReq.componentId()));

            ItemInComponentOrder item = new ItemInComponentOrder();
            item.setComponentOrder(order);
            item.setComponent(component);
            item.setItemsQuantity(itemReq.quantity());
            item.setUnitPrice(itemReq.unitPrice());
            item.setCreateDatetime(LocalDateTime.now());

            ItemInComponentOrder savedItem = itemInComponentOrderRepository.save(item);
            itemResponses.add(new ComponentOrderResponse.ItemResponse(
                    savedItem.getId(),
                    component.getId(),
                    component.getComponentModel(),
                    itemReq.quantity(),
                    itemReq.unitPrice()
            ));
        }

        return new ComponentOrderResponse(
                order.getId(),
                order.getComponentOrderNumber(),
                order.getComponentOrderCreatedAt(),
                order.getExpectedExecutionDate(),
                estimatedSum,
                order.getComponentOrderStatus().getComponentOrderStatusName(),
                supplier.getCompanyName(),
                itemResponses
        );
    }

    // ── Архів замовлень комплектуючих ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ActiveComponentOrderResponse> getArchivedComponentOrders() {
        List<ComponentOrder> orders = componentOrderRepository.findAllArchived();
        if (orders.isEmpty()) return List.of();

        // Позиції всіх архівних замовлень — одним JOIN-запитом, без IN-параметрів
        Map<Integer, List<ItemInComponentOrder>> itemsByOrderId = itemInComponentOrderRepository
                .findArchivedWithDetails()
                .stream()
                .collect(Collectors.groupingBy(iico -> iico.getComponentOrder().getId()));

        // Поставлені кількості по всіх позиціях — одним JOIN-запитом, без IN-параметрів
        Map<Integer, Integer> suppliedMap = itemInSupplyRepository
                .sumSuppliedForArchived()
                .stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).intValue(),
                        row -> ((Number) row[1]).intValue()
                ));

        return orders.stream().map(order -> {
            List<ActiveComponentOrderResponse.ComponentItem> items =
                    itemsByOrderId.getOrDefault(order.getId(), List.of()).stream()
                            .map(iico -> {
                                Component c = iico.getComponent();
                                return new ActiveComponentOrderResponse.ComponentItem(
                                        c.getComponentModel(),
                                        c.getComponentCategory() != null
                                                ? c.getComponentCategory().getComponentCategoryName() : null,
                                        c.getProducer() != null
                                                ? c.getProducer().getProducerCompanyName() : null,
                                        iico.getItemsQuantity(),
                                        suppliedMap.getOrDefault(iico.getId(), 0)
                                );
                            })
                            .toList();

            return new ActiveComponentOrderResponse(
                    order.getId(),
                    order.getComponentOrderNumber(),
                    order.getComponentOrderCreatedAt(),
                    order.getEstimatedOrderSum(),
                    order.getExpectedExecutionDate(),
                    order.getComponentOrderStatus().getComponentOrderStatusName(),
                    items
            );
        }).toList();
    }

    // ── Endpoint 1: деталі замовлення ────────────────────────────────────────

    @Transactional(readOnly = true)
    public ComponentOrderDetailResponse getOrderDetail(Integer orderId) {
        ComponentOrder order = componentOrderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("ComponentOrder not found: " + orderId));

        List<ItemInComponentOrder> items =
                itemInComponentOrderRepository.findByComponentOrderIdWithDetails(orderId);

        // Поставлена кількість по кожній позиції: itemId -> suppliedQty
        Map<Integer, Integer> suppliedMap = itemInSupplyRepository
                .sumSuppliedByComponentOrderId(orderId)
                .stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).intValue(),
                        row -> ((Number) row[1]).intValue()
                ));

        List<ComponentOrderDetailResponse.OrderItem> orderItems = items.stream()
                .map(iico -> {
                    Component c = iico.getComponent();
                    return new ComponentOrderDetailResponse.OrderItem(
                            iico.getId(),
                            c.getId(),
                            c.getComponentModel(),
                            c.getComponentCategory() != null ? c.getComponentCategory().getComponentCategoryName() : null,
                            c.getProducer() != null ? c.getProducer().getProducerCompanyName() : null,
                            iico.getItemsQuantity(),
                            iico.getUnitPrice(),
                            suppliedMap.getOrDefault(iico.getId(), 0)
                    );
                })
                .toList();

        return new ComponentOrderDetailResponse(
                order.getId(),
                order.getComponentOrderNumber(),
                order.getComponentOrderCreatedAt(),
                order.getExpectedExecutionDate(),
                order.getSupplier() != null ? order.getSupplier().getCompanyName() : null,
                order.getComponentOrderStatus() != null
                        ? order.getComponentOrderStatus().getComponentOrderStatusName() : null,
                orderItems
        );
    }

    // ── Endpoint 2: список поставок по замовленню ─────────────────────────

    @Transactional(readOnly = true)
    public List<SupplyResponse> getSupplies(Integer orderId) {
        // Перевіряємо що замовлення існує
        if (!componentOrderRepository.existsById(orderId)) {
            throw new ResourceNotFoundException("ComponentOrder not found: " + orderId);
        }

        List<ItemInSupply> rows = itemInSupplyRepository.findByComponentOrderIdWithDetails(orderId);

        // Групуємо по supply, зберігаємо порядок (за id DESC з запиту)
        Map<Integer, SupplyResponse> grouped = new LinkedHashMap<>();
        for (ItemInSupply iis : rows) {
            Supply s = iis.getSupply();
            ItemInComponentOrder iico = iis.getItemInComponentOrder();
            Component c = iico.getComponent();

            SupplyResponse.SupplyItem item = new SupplyResponse.SupplyItem(
                    iico.getId(),
                    c.getComponentModel(),
                    c.getComponentCategory() != null ? c.getComponentCategory().getComponentCategoryName() : null,
                    c.getProducer() != null ? c.getProducer().getProducerCompanyName() : null,
                    iico.getUnitPrice(),
                    iis.getItemInSupplyQuantity()
            );

            grouped.compute(s.getId(), (key, existing) -> {
                if (existing == null) {
                    BigDecimal deliverySum = s.getSuplySumPrice() != null ? s.getSuplySumPrice() : BigDecimal.ZERO;
                    List<SupplyResponse.SupplyItem> items = new ArrayList<>();
                    items.add(item);
                    return new SupplyResponse(
                            s.getId(),
                            s.getInvoiceNumber(),
                            s.getSupplyDateTime(),
                            s.getWorker() != null ? s.getWorker().getWorkerFullName() : null,
                            deliverySum,
                            items
                    );
                } else {
                    existing.items().add(item);
                    return existing;
                }
            });
        }

        return new ArrayList<>(grouped.values());
    }

    // ── Endpoint 3: створення поставки ───────────────────────────────────

    @Transactional
    public SupplyResponse createSupply(Integer orderId, CreateSupplyRequest request, Integer workerId) {
        ComponentOrder order = componentOrderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("ComponentOrder not found: " + orderId));

        Worker worker = workerRepository.findByIdWithBranch(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        Branch workerBranch = worker.getBranch();
        if (workerBranch == null) {
            throw new ResourceNotFoundException("Worker has no branch assigned");
        }

        // Завантажуємо позиції замовлення та рахуємо deliverySum
        List<ItemInComponentOrder> orderItems = itemInComponentOrderRepository
                .findByComponentOrderIdWithDetails(orderId);
        Map<Integer, ItemInComponentOrder> orderItemMap = orderItems.stream()
                .collect(Collectors.toMap(ItemInComponentOrder::getId, i -> i));

        BigDecimal deliverySum = BigDecimal.ZERO;
        for (CreateSupplyRequest.SupplyItem reqItem : request.items()) {
            ItemInComponentOrder iico = orderItemMap.get(reqItem.orderItemId());
            if (iico == null) {
                throw new ResourceNotFoundException(
                        "OrderItem " + reqItem.orderItemId() + " not found in order " + orderId);
            }
            if (iico.getUnitPrice() != null) {
                deliverySum = deliverySum.add(
                        iico.getUnitPrice().multiply(BigDecimal.valueOf(reqItem.quantity())));
            }
        }

        // Створюємо Supply
        Supply supply = new Supply();
        supply.setInvoiceNumber(request.invoiceNumber());
        supply.setSupplyDateTime(LocalDateTime.now());
        supply.setSuplySumPrice(deliverySum);
        supply.setWorker(worker);
        supply.setCreateDatetime(LocalDateTime.now());
        Supply savedSupply = supplyRepository.save(supply);

        // Створюємо ItemInSupply для кожної позиції
        // BranchStockId потрібен для тригера оновлення залишків
        List<SupplyResponse.SupplyItem> responseItems = new ArrayList<>();
        for (CreateSupplyRequest.SupplyItem reqItem : request.items()) {
            ItemInComponentOrder iico = orderItemMap.get(reqItem.orderItemId());
            Component component = iico.getComponent();

            BranchStock branchStock = branchStockRepository
                    .findByBranchIdAndComponentId(workerBranch.getId(), component.getId())
                    .orElseGet(() -> {
                        BranchStock newStock = new BranchStock();
                        newStock.setBranch(workerBranch);
                        newStock.setComponent(component);
                        newStock.setCurrentQuantity(0);
                        newStock.setCreateDatetime(LocalDateTime.now());
                        return branchStockRepository.save(newStock);
                    });

            ItemInSupply iis = new ItemInSupply();
            iis.setSupply(savedSupply);
            iis.setItemInComponentOrder(iico);
            iis.setBranchStock(branchStock);
            iis.setItemInSupplyQuantity(reqItem.quantity());
            iis.setCreateDatetime(LocalDateTime.now());
            itemInSupplyRepository.saveAndFlush(iis); // saveAndFlush — щоб тригер спрацював і помилка перекидання кількості стала видимою одразу

            responseItems.add(new SupplyResponse.SupplyItem(
                    iico.getId(),
                    component.getComponentModel(),
                    component.getComponentCategory() != null
                            ? component.getComponentCategory().getComponentCategoryName() : null,
                    component.getProducer() != null
                            ? component.getProducer().getProducerCompanyName() : null,
                    iico.getUnitPrice(),
                    reqItem.quantity()
            ));
        }

        return new SupplyResponse(
                savedSupply.getId(),
                savedSupply.getInvoiceNumber(),
                savedSupply.getSupplyDateTime(),
                worker.getWorkerFullName(),
                deliverySum,
                responseItems
        );
    }

    private static LocalDate toLocalDate(Date date) {
        return date != null ? date.toLocalDate() : null;
    }

    private String generateOrderNumber() {
        String maxNumber = componentOrderRepository.findMaxOrderNumber().orElse(null);
        int nextNum = 1;
        if (maxNumber != null && maxNumber.startsWith("OR")) {
            try {
                nextNum = Integer.parseInt(maxNumber.substring(2)) + 1;
            } catch (NumberFormatException ignored) {
                nextNum = 1;
            }
        }
        return String.format("OR%08d", nextNum);
    }

}
