package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateComponentOrderRequest;
import org.nulp.backend.dto.request.CreateSupplyRequest;
import org.nulp.backend.dto.request.UpdateComponentOrderRequest;
import org.nulp.backend.dto.response.ActiveComponentOrderResponse;
import org.nulp.backend.dto.response.ComponentOrderDetailResponse;
import org.nulp.backend.dto.response.ComponentOrderResponse;
import org.nulp.backend.dto.response.SupplyResponse;
import org.nulp.backend.entity.User;
import org.nulp.backend.service.ComponentOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/component-orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
public class ComponentOrderController {

    private final ComponentOrderService componentOrderService;

    @GetMapping("/active")
    public ResponseEntity<List<ActiveComponentOrderResponse>> getActive() {
        return ResponseEntity.ok(componentOrderService.getActive());
    }

    @GetMapping("/archive")
    public ResponseEntity<List<ActiveComponentOrderResponse>> getArchive() {
        return ResponseEntity.ok(componentOrderService.getArchivedComponentOrders());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ComponentOrderDetailResponse> getDetail(@PathVariable Integer orderId) {
        return ResponseEntity.ok(componentOrderService.getOrderDetail(orderId));
    }

    @GetMapping("/{orderId}/supplies")
    public ResponseEntity<List<SupplyResponse>> getSupplies(@PathVariable Integer orderId) {
        return ResponseEntity.ok(componentOrderService.getSupplies(orderId));
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> delete(@PathVariable Integer orderId) {
        componentOrderService.deleteOrder(orderId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{orderId}")
    public ResponseEntity<ComponentOrderResponse> update(
            @PathVariable Integer orderId,
            @Valid @RequestBody UpdateComponentOrderRequest request) {
        return ResponseEntity.ok(componentOrderService.updateOrder(orderId, request));
    }

    @PostMapping("/{orderId}/supplies")
    public ResponseEntity<SupplyResponse> createSupply(
            @PathVariable Integer orderId,
            @Valid @RequestBody CreateSupplyRequest request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Integer workerId = currentUser.getWorker().getId();
        return ResponseEntity.status(201).body(componentOrderService.createSupply(orderId, request, workerId));
    }

    @PostMapping
    public ResponseEntity<ComponentOrderResponse> create(
            @Valid @RequestBody CreateComponentOrderRequest request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Integer workerId = currentUser.getWorker().getId();
        return ResponseEntity.status(201).body(componentOrderService.create(request, workerId));
    }
}
