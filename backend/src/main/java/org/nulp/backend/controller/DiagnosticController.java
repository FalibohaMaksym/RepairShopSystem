package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CompleteDiagnosticRequest;
import org.nulp.backend.dto.request.SaveDiagnosticDraftRequest;
import org.nulp.backend.dto.response.DiagnosticResponse;
import org.nulp.backend.entity.User;
import org.nulp.backend.service.DiagnosticService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class DiagnosticController {

    private final DiagnosticService diagnosticService;

    @PostMapping("/{orderNumber}/diagnostic")
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<DiagnosticResponse> createDiagnostic(
            @PathVariable String orderNumber,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(diagnosticService.create(orderNumber, currentUser.getWorker().getId()));
    }

    @PatchMapping("/{orderNumber}/diagnostic/draft")
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<DiagnosticResponse> saveDraft(
            @PathVariable String orderNumber,
            @Valid @RequestBody SaveDiagnosticDraftRequest request) {
        return ResponseEntity.ok(diagnosticService.saveDraft(orderNumber, request));
    }

    @PatchMapping("/{orderNumber}/diagnostic")
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<DiagnosticResponse> completeDiagnostic(
            @PathVariable String orderNumber,
            @Valid @RequestBody CompleteDiagnosticRequest request) {
        return ResponseEntity.ok(diagnosticService.complete(orderNumber, request));
    }

    @GetMapping("/{orderNumber}/diagnostic")
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<DiagnosticResponse> getDiagnostic(@PathVariable String orderNumber) {
        return ResponseEntity.ok(diagnosticService.getByOrderNumber(orderNumber));
    }
}
