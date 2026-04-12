package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateBranchRequest;
import org.nulp.backend.dto.response.BranchResponse;
import org.nulp.backend.entity.Branch;
import org.nulp.backend.entity.User;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.BranchRepository;
import org.nulp.backend.service.BranchService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
public class BranchController {

    private final BranchService branchService;
    private final BranchRepository branchRepository;

    @GetMapping("/my")
    public ResponseEntity<BranchResponse> getMy(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        Branch branch = currentUser.getWorker().getBranch();
        if (branch == null) {
            throw new ResourceNotFoundException("Worker has no branch assigned");
        }
        return ResponseEntity.ok(toResponse(branch));
    }

    @GetMapping
    public ResponseEntity<List<BranchResponse>> getAll() {
        return ResponseEntity.ok(branchService.getAll());
    }

    @GetMapping("/search")
    public ResponseEntity<List<BranchResponse>> search(@RequestParam String query) {
        return ResponseEntity.ok(branchService.search(query));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_Системний адміністратор')")
    public ResponseEntity<BranchResponse> create(@Valid @RequestBody CreateBranchRequest req) {
        Branch b = new Branch();
        b.setBranchAddress(req.address());
        b.setBranchPhoneNumber(req.phoneNumber());
        b.setBranchEmail(req.email());
        b.setCreateDatetime(LocalDateTime.now());
        return ResponseEntity.status(201).body(toResponse(branchRepository.save(b)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_Системний адміністратор')")
    public ResponseEntity<BranchResponse> update(@PathVariable Integer id,
                                                  @Valid @RequestBody CreateBranchRequest req) {
        Branch b = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + id));
        b.setBranchAddress(req.address());
        b.setBranchPhoneNumber(req.phoneNumber());
        b.setBranchEmail(req.email());
        b.setUpdateDatetime(LocalDateTime.now());
        return ResponseEntity.ok(toResponse(branchRepository.save(b)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_Системний адміністратор')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!branchRepository.existsById(id))
            throw new ResourceNotFoundException("Branch not found: " + id);
        branchRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private BranchResponse toResponse(Branch b) {
        return new BranchResponse(b.getId(), b.getBranchAddress(), b.getBranchPhoneNumber(), b.getBranchEmail());
    }
}
