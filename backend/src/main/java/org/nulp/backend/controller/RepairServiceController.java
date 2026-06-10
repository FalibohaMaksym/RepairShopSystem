package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateServiceRequest;
import org.nulp.backend.dto.response.WorkerServiceResponse;
import org.nulp.backend.entity.Service;
import org.nulp.backend.entity.ServiceCategory;
import org.nulp.backend.entity.ServiceComplexity;
import org.nulp.backend.entity.DeviceType;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.DeviceTypeRepository;
import org.nulp.backend.repository.ServiceCategoryRepository;
import org.nulp.backend.repository.ServiceComplexityRepository;
import org.nulp.backend.repository.ServiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

/**
 * CRUD для довідника послуг (Service entity).
 * GET — усі адміністратори; POST/PUT/DELETE — тільки Системний адміністратор.
 */
@RestController
@RequestMapping("/api/repair-services")
@RequiredArgsConstructor
public class RepairServiceController {

    private final ServiceRepository serviceRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final ServiceComplexityRepository serviceComplexityRepository;
    private final DeviceTypeRepository deviceTypeRepository;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<WorkerServiceResponse>> getAll() {
        return ResponseEntity.ok(serviceRepository.findAllWithDetails().stream()
                .map(this::toResponse)
                .toList());
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<WorkerServiceResponse>> search(@RequestParam String query) {
        return ResponseEntity.ok(serviceRepository.searchByName(query).stream()
                .map(this::toResponse)
                .toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_Системний адміністратор')")
    public ResponseEntity<WorkerServiceResponse> create(@Valid @RequestBody CreateServiceRequest req) {
        Service s = buildService(new Service(), req);
        s.setCreateDatetime(LocalDateTime.now());
        return ResponseEntity.status(201).body(toResponse(serviceRepository.save(s)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_Системний адміністратор')")
    public ResponseEntity<WorkerServiceResponse> update(@PathVariable Integer id,
                                                         @Valid @RequestBody CreateServiceRequest req) {
        Service s = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found: " + id));
        buildService(s, req);
        s.setUpdateDatetime(LocalDateTime.now());
        return ResponseEntity.ok(toResponse(serviceRepository.save(s)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_Системний адміністратор')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!serviceRepository.existsById(id))
            throw new ResourceNotFoundException("Service not found: " + id);
        serviceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Service buildService(Service s, CreateServiceRequest req) {
        ServiceCategory category = serviceCategoryRepository.findById(req.categoryId().shortValue())
                .orElseThrow(() -> new ResourceNotFoundException("ServiceCategory not found: " + req.categoryId()));
        ServiceComplexity complexity = serviceComplexityRepository.findById(req.complexityId().shortValue())
                .orElseThrow(() -> new ResourceNotFoundException("ServiceComplexity not found: " + req.complexityId()));
        DeviceType deviceType = deviceTypeRepository.findById(req.deviceTypeId().shortValue())
                .orElseThrow(() -> new ResourceNotFoundException("DeviceType not found: " + req.deviceTypeId()));

        s.setServiceName(req.serviceName());
        s.setServiceEstimatedPrice(req.estimatedPrice());
        s.setServiceCategory(category);
        s.setServiceComplexity(complexity);
        s.setDeviceType(deviceType);
        return s;
    }

    private WorkerServiceResponse toResponse(Service s) {
        return new WorkerServiceResponse(
                null,
                s.getId(),
                s.getServiceName(),
                s.getServiceEstimatedPrice(),
                s.getServiceCategory() != null ? s.getServiceCategory().getServiceCategoryName() : null,
                s.getServiceComplexity() != null ? s.getServiceComplexity().getServiceComplexityValue() : null,
                s.getDeviceType() != null ? s.getDeviceType().getDeviceTypeName() : null
        );
    }
}
