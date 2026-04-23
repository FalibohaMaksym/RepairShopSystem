package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.TransferRequest;
import org.nulp.backend.dto.response.MissingComponentResponse;
import org.nulp.backend.dto.response.StockItemResponse;
import org.nulp.backend.entity.User;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.service.StockService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
public class StockController {

    private final StockService stockService;

    @GetMapping
    public ResponseEntity<List<StockItemResponse>> getStock(
            @RequestParam(required = false) Integer branchId) {
        return ResponseEntity.ok(stockService.getStock(branchId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<StockItemResponse>> getMyStock(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        var branch = currentUser.getWorker().getBranch();
        if (branch == null) {
            throw new ResourceNotFoundException("Worker has no branch assigned");
        }
        return ResponseEntity.ok(stockService.getStock(branch.getId()));
    }

    @GetMapping("/missing")
    public ResponseEntity<List<MissingComponentResponse>> getMissing(
            Authentication authentication,
            @RequestParam(required = false) Integer componentId) {
        User currentUser = (User) authentication.getPrincipal();
        Integer workerId = currentUser.getWorker().getId();
        return ResponseEntity.ok(stockService.getMissingComponents(workerId, componentId));
    }

    @PostMapping("/transfer")
    public ResponseEntity<Void> transfer(
            @Valid @RequestBody TransferRequest request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        var branch = currentUser.getWorker().getBranch();
        Integer workerBranchId = branch != null ? branch.getId() : null;
        stockService.transfer(request, workerBranchId);
        return ResponseEntity.noContent().build();
    }
}
