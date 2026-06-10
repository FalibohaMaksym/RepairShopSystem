package org.nulp.backend.dto.response;

public record AuthResponse(
        String accessToken,
        String role,
        Integer userId,
        Integer workerId,
        String fullName
) {}
