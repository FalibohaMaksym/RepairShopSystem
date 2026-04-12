package org.nulp.backend.dto.response;

public record WorkerResponse(
        Integer id,
        String fullName,
        String phoneNumber,
        String email,
        String positionName,
        Integer branchId,
        String branchAddress
) {}
