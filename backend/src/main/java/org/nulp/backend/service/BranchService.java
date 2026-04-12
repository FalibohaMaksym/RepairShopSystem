package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.response.BranchResponse;
import org.nulp.backend.entity.Branch;
import org.nulp.backend.repository.BranchRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;

    public List<BranchResponse> getAll() {
        return branchRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BranchResponse> search(String query) {
        return branchRepository.search(query).stream()
                .map(this::toResponse)
                .toList();
    }

    private BranchResponse toResponse(Branch b) {
        return new BranchResponse(b.getId(), b.getBranchAddress(), b.getBranchPhoneNumber(), b.getBranchEmail());
    }
}
