package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.response.RoleResponse;
import org.nulp.backend.entity.Role;
import org.nulp.backend.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    public List<RoleResponse> getAll() {
        return roleRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private RoleResponse toResponse(Role r) {
        return new RoleResponse(r.getId(), r.getRoleName());
    }
}
