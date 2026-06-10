package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.ConfirmRepairRequest;
import org.nulp.backend.dto.request.CreateOrderRequest;
import org.nulp.backend.dto.response.ActiveOrderResponse;
import org.nulp.backend.dto.response.ArchiveOrderResponse;
import org.nulp.backend.dto.response.AvailableOrderResponse;
import org.nulp.backend.dto.response.OrderAvailableServiceResponse;
import org.nulp.backend.dto.response.OrderChildrenResponse;
import org.nulp.backend.dto.response.OrderDetailResponse;
import org.nulp.backend.dto.response.OrderResponse;
import org.nulp.backend.dto.response.RepairResponse;
import org.nulp.backend.entity.User;
import org.nulp.backend.service.OrderService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/{orderNumber}")
    public ResponseEntity<OrderDetailResponse> getByOrderNumber(@PathVariable String orderNumber) {
        return ResponseEntity.ok(orderService.getByOrderNumber(orderNumber));
    }

    @GetMapping("/{orderNumber}/children")
    public ResponseEntity<OrderChildrenResponse> checkChildren(@PathVariable String orderNumber) {
        return ResponseEntity.ok(orderService.checkChildren(orderNumber));
    }

    @GetMapping("/{orderNumber}/services/all")
    public ResponseEntity<List<OrderAvailableServiceResponse>> getAllServicesForOrder(@PathVariable String orderNumber) {
        return ResponseEntity.ok(orderService.getAllServicesForOrder(orderNumber));
    }

    @GetMapping("/{orderNumber}/ticket")
    public ResponseEntity<byte[]> getTicket(@PathVariable String orderNumber) {
        byte[] pdf = orderService.generateTicket(orderNumber);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "ticket-" + orderNumber + ".pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    @GetMapping("/available")
    public ResponseEntity<List<AvailableOrderResponse>> getAvailableOrders(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getAvailableOrdersForWorker(currentUser.getWorker().getId()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrderDetailResponse>> getMyOrders(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getInProgressOrdersForWorker(currentUser.getWorker().getId()));
    }

    @GetMapping("/active")
    public ResponseEntity<List<ActiveOrderResponse>> getActiveOrders(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Integer workerId = currentUser.getWorker().getId();
        return ResponseEntity.ok(orderService.getActiveOrdersForWorkerBranch(workerId));
    }

    @GetMapping("/archive")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<ArchiveOrderResponse>> getArchivedOrders(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Integer workerId = currentUser.getWorker().getId();
        return ResponseEntity.ok(orderService.getArchivedOrdersForWorkerBranch(workerId));
    }

    @PatchMapping("/{orderNumber}/complete")
    public ResponseEntity<Void> complete(@PathVariable String orderNumber) {
        orderService.completeOrder(orderNumber);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{orderNumber}/decline")
    public ResponseEntity<Void> decline(@PathVariable String orderNumber) {
        orderService.declineOrder(orderNumber);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{orderNumber}/repair")
    public ResponseEntity<List<RepairResponse>> confirmRepair(
            @PathVariable String orderNumber,
            @Valid @RequestBody ConfirmRepairRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.confirmRepairs(orderNumber, request));
    }

    @DeleteMapping("/{orderNumber}")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<Void> delete(@PathVariable String orderNumber) {
        orderService.deleteOrder(orderNumber);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(request));
    }
}
