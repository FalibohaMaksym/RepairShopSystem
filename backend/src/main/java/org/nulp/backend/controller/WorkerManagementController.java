package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.AddWorkerServiceRequest;
import org.nulp.backend.dto.response.WorkerServiceResponse;
import org.nulp.backend.entity.Branch;
import org.nulp.backend.entity.Service;
import org.nulp.backend.entity.Worker;
import org.nulp.backend.entity.WorkerService;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.BranchRepository;
import org.nulp.backend.repository.ServiceRepository;
import org.nulp.backend.repository.WorkerRepository;
import org.nulp.backend.repository.WorkerServiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Управління послугами та відділенням конкретного працівника.
 * Доступ: Системний адміністратор.
 */
@RestController
@RequestMapping("/api/workers/{workerId}")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_Системний адміністратор')")
public class WorkerManagementController {

    private final WorkerRepository workerRepository;
    private final WorkerServiceRepository workerServiceRepository;
    private final ServiceRepository serviceRepository;
    private final BranchRepository branchRepository;

    // ── Послуги працівника ────────────────────────────────────────────────────

    /**
     * GET /api/workers/{workerId}/services
     * Перелік послуг, які може проводити працівник.
     */
    @GetMapping("/services")
    public ResponseEntity<List<WorkerServiceResponse>> getWorkerServices(@PathVariable Integer workerId) {
        if (!workerRepository.existsById(workerId))
            throw new ResourceNotFoundException("Worker not found: " + workerId);

        return ResponseEntity.ok(
                workerServiceRepository.findByWorkerIdWithServiceDetails(workerId).stream()
                        .map(this::toResponse)
                        .toList());
    }

    /**
     * POST /api/workers/{workerId}/services
     * Додати послугу до компетенції працівника.
     */
    @PostMapping("/services")
    public ResponseEntity<WorkerServiceResponse> addWorkerService(@PathVariable Integer workerId,
                                                                   @Valid @RequestBody AddWorkerServiceRequest req) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        Service service = serviceRepository.findById(req.serviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found: " + req.serviceId()));

        WorkerService ws = new WorkerService();
        ws.setWorker(worker);
        ws.setService(service);
        ws.setCreateDatetime(LocalDateTime.now());

        WorkerService saved = workerServiceRepository.save(ws);
        return ResponseEntity.status(201).body(toResponse(saved));
    }

    /**
     * DELETE /api/workers/{workerId}/services/{workerServiceId}
     * Видалити послугу з компетенції працівника.
     */
    @DeleteMapping("/services/{workerServiceId}")
    public ResponseEntity<Void> removeWorkerService(@PathVariable Integer workerId,
                                                     @PathVariable Integer workerServiceId) {
        WorkerService ws = workerServiceRepository.findById(workerServiceId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkerService not found: " + workerServiceId));

        if (!ws.getWorker().getId().equals(workerId))
            throw new ResourceNotFoundException("WorkerService does not belong to worker: " + workerId);

        workerServiceRepository.delete(ws);
        return ResponseEntity.noContent().build();
    }

    // ── Зміна відділення ──────────────────────────────────────────────────────

    /**
     * PUT /api/workers/{workerId}/branch/{newBranchId}
     * Перемістити працівника до іншого відділення.
     */
    @PutMapping("/branch/{newBranchId}")
    public ResponseEntity<Void> transferBranch(@PathVariable Integer workerId,
                                                @PathVariable Integer newBranchId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        Branch branch = branchRepository.findById(newBranchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + newBranchId));

        worker.setBranch(branch);
        worker.setUpdateDatetime(LocalDateTime.now());
        workerRepository.save(worker);
        return ResponseEntity.noContent().build();
    }

    // ── helper ────────────────────────────────────────────────────────────────

    private WorkerServiceResponse toResponse(WorkerService ws) {
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
