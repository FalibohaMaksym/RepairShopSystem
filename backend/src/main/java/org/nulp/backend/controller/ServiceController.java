package org.nulp.backend.controller;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.response.WorkerServiceResponse;
import org.nulp.backend.entity.User;
import org.nulp.backend.entity.WorkerService;
import org.nulp.backend.repository.WorkerServiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
public class ServiceController {

    private final WorkerServiceRepository workerServiceRepository;

    @GetMapping("/my")
    public ResponseEntity<List<WorkerServiceResponse>> getMyServices(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Integer workerId = currentUser.getWorker().getId();

        List<WorkerServiceResponse> result = workerServiceRepository
                .findByWorkerIdWithServiceDetails(workerId).stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(result);
    }

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
