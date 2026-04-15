package org.nulp.backend.controller;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.response.RepairPriorityResponse;
import org.nulp.backend.repository.RepairPriorityRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/repair-priorities")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
public class RepairPriorityController {

    private final RepairPriorityRepository repairPriorityRepository;

    @GetMapping
    public ResponseEntity<List<RepairPriorityResponse>> getAll() {
        return ResponseEntity.ok(
                repairPriorityRepository.findAll().stream()
                        .map(p -> new RepairPriorityResponse(p.getId(), p.getRepairPriorityValue()))
                        .toList()
        );
    }
}
