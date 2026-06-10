package org.nulp.backend.dto.response;

public record UserResponse(
        Integer id,
        Integer workerId,
        String workerFullName,
        String workerEmail,
        String workerPhoneNumber,
        String positionName,
        Integer branchId,
        String branchAddress,
        Integer roleId,
        String roleName
) {}
