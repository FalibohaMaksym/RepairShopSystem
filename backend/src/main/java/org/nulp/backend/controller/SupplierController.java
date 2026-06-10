package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateSupplierRequest;
import org.nulp.backend.dto.response.SupplierResponse;
import org.nulp.backend.entity.Supplier;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.SupplierRepository;
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

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
public class SupplierController {

    private final SupplierRepository supplierRepository;

    @GetMapping
    public ResponseEntity<List<SupplierResponse>> getAll() {
        return ResponseEntity.ok(supplierRepository.findAll().stream()
                .map(this::toResponse)
                .toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<SupplierResponse> create(@Valid @RequestBody CreateSupplierRequest req) {
        Supplier s = new Supplier();
        s.setCompanyName(req.companyName());
        s.setSupplierPhone(req.phone());
        s.setSupplierEmail(req.email());
        s.setCreateDatetime(LocalDateTime.now());
        return ResponseEntity.status(201).body(toResponse(supplierRepository.save(s)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_Системний адміністратор')")
    public ResponseEntity<SupplierResponse> update(@PathVariable Integer id,
                                                    @Valid @RequestBody CreateSupplierRequest req) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));
        s.setCompanyName(req.companyName());
        s.setSupplierPhone(req.phone());
        s.setSupplierEmail(req.email());
        s.setUpdateDatetime(LocalDateTime.now());
        return ResponseEntity.ok(toResponse(supplierRepository.save(s)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!supplierRepository.existsById(id))
            throw new ResourceNotFoundException("Supplier not found: " + id);
        supplierRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private SupplierResponse toResponse(Supplier s) {
        return new SupplierResponse(s.getId(), s.getCompanyName(), s.getSupplierPhone(), s.getSupplierEmail());
    }
}
