package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateDeviceDefectRequest;
import org.nulp.backend.dto.response.DiagnosticResponse.DefectResponse;
import org.nulp.backend.entity.DeviceDefect;
import org.nulp.backend.exception.ForbiddenException;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.DefectInDiagnosticRepository;
import org.nulp.backend.repository.DeviceDefectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
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
@RequestMapping("/api/device-defects")
@RequiredArgsConstructor
public class DeviceDefectController {

    private final DeviceDefectRepository deviceDefectRepository;
    private final DefectInDiagnosticRepository defectInDiagnosticRepository;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<DefectResponse>> getAll() {
        List<DefectResponse> defects = deviceDefectRepository.findAll().stream()
                .map(d -> new DefectResponse(d.getId(), d.getDeviceDefectName()))
                .toList();
        return ResponseEntity.ok(defects);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Системний адміністратор')")
    public ResponseEntity<DefectResponse> create(@Valid @RequestBody CreateDeviceDefectRequest request) {
        DeviceDefect defect = new DeviceDefect();
        defect.setDeviceDefectName(request.name());
        DeviceDefect saved = deviceDefectRepository.save(defect);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new DefectResponse(saved.getId(), saved.getDeviceDefectName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Системний адміністратор')")
    public ResponseEntity<DefectResponse> update(
            @PathVariable Short id,
            @Valid @RequestBody CreateDeviceDefectRequest request) {
        DeviceDefect defect = deviceDefectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Device defect not found: " + id));

        long usageCount = defectInDiagnosticRepository.countByDeviceDefectId(id);
        if (usageCount > 1) {
            throw new ForbiddenException(
                    "Cannot edit defect linked to " + usageCount + " diagnostics (max allowed: 1)");
        }

        defect.setDeviceDefectName(request.name());
        DeviceDefect saved = deviceDefectRepository.save(defect);
        return ResponseEntity.ok(new DefectResponse(saved.getId(), saved.getDeviceDefectName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Системний адміністратор')")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Short id) {
        if (!deviceDefectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Device defect not found: " + id);
        }

        long usageCount = defectInDiagnosticRepository.countByDeviceDefectId(id);
        if (usageCount > 1) {
            throw new ForbiddenException(
                    "Cannot delete defect linked to " + usageCount + " diagnostics (max allowed: 1)");
        }

        if (usageCount == 1) {
            defectInDiagnosticRepository.deleteByDeviceDefectId(id);
        }

        deviceDefectRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
