package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateRepairServiceRequest;
import org.nulp.backend.dto.response.RepairListItemResponse;
import org.nulp.backend.dto.response.WorkerServiceResponse;
import org.nulp.backend.entity.User;
import org.nulp.backend.entity.WorkerService;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.WorkerServiceRepository;
import org.nulp.backend.service.RepairQueryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
public class RepairController {

    private final RepairQueryService repairQueryService;
    private final WorkerServiceRepository workerServiceRepository;

    @GetMapping("/{orderNumber}/services/available")
    public ResponseEntity<List<WorkerServiceResponse>> getAvailableServices(
            @PathVariable String orderNumber,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Integer workerId = currentUser.getWorker().getId();

        List<WorkerServiceResponse> result = workerServiceRepository
                .findByWorkerIdAndOrderDeviceType(workerId, orderNumber).stream()
                .map(this::toWorkerServiceResponse)
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{orderNumber}/repairs")
    public ResponseEntity<List<RepairListItemResponse>> getRepairs(@PathVariable String orderNumber) {
        return ResponseEntity.ok(repairQueryService.getRepairsByOrderNumber(orderNumber));
    }

    @PatchMapping("/{orderNumber}/repairs/{repairId}/pause")
    public ResponseEntity<RepairListItemResponse> pauseRepair(
            @PathVariable String orderNumber,
            @PathVariable Integer repairId) {
        return ResponseEntity.ok(repairQueryService.pauseRepair(repairId, orderNumber));
    }

    @PatchMapping("/{orderNumber}/repairs/{repairId}/finish")
    public ResponseEntity<RepairListItemResponse> finishRepair(
            @PathVariable String orderNumber,
            @PathVariable Integer repairId) {
        return ResponseEntity.ok(repairQueryService.finishRepair(repairId, orderNumber));
    }

    @PutMapping("/{orderNumber}/repairs/{repairId}/services/{serviceId}")
    public ResponseEntity<RepairListItemResponse.ServiceItem> updateService(
            @PathVariable String orderNumber,
            @PathVariable Integer repairId,
            @PathVariable Integer serviceId,
            @Valid @RequestBody CreateRepairServiceRequest request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        var branch = currentUser.getWorker().getBranch();
        if (branch == null) {
            throw new ResourceNotFoundException("Worker has no branch assigned");
        }
        return ResponseEntity.ok(repairQueryService.updateService(serviceId, repairId, orderNumber, request, branch));
    }

    @PatchMapping("/{orderNumber}/repairs/{repairId}/services/{serviceId}/start")
    public ResponseEntity<RepairListItemResponse.ServiceItem> startService(
            @PathVariable String orderNumber,
            @PathVariable Integer repairId,
            @PathVariable Integer serviceId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Integer workerId = currentUser.getWorker().getId();
        return ResponseEntity.ok(repairQueryService.startService(serviceId, repairId, orderNumber, workerId));
    }

    @PatchMapping("/{orderNumber}/repairs/{repairId}/services/{serviceId}/finish")
    public ResponseEntity<RepairListItemResponse.ServiceItem> finishService(
            @PathVariable String orderNumber,
            @PathVariable Integer repairId,
            @PathVariable Integer serviceId) {
        return ResponseEntity.ok(repairQueryService.finishService(serviceId, repairId, orderNumber));
    }

    @PostMapping("/{orderNumber}/repairs/{repairId}/services")
    public ResponseEntity<RepairListItemResponse.ServiceItem> planService(
            @PathVariable String orderNumber,
            @PathVariable Integer repairId,
            @Valid @RequestBody CreateRepairServiceRequest request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        var branch = currentUser.getWorker().getBranch();
        if (branch == null) {
            throw new ResourceNotFoundException("Worker has no branch assigned");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(repairQueryService.planService(repairId, orderNumber, request, branch));
    }

    private WorkerServiceResponse toWorkerServiceResponse(WorkerService ws) {
        var s = ws.getService();
        return new WorkerServiceResponse(
                ws.getId(),
                s.getId(),
                s.getServiceName(),
                s.getServiceEstimatedPrice(),
                s.getServiceCategory() != null ? s.getServiceCategory().getServiceCategoryName() : null,
                s.getServiceComplexity() != null ? s.getServiceComplexity().getServiceComplexityValue() : null,
                s.getDeviceType() != null ? s.getDeviceType().getDeviceTypeName() : null
        );
    }
}
