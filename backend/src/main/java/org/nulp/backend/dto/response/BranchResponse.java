package org.nulp.backend.dto.response;

public record BranchResponse(
        Integer id,
        String address,
        String phoneNumber,
        String email
) {}
