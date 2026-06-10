package org.nulp.backend.dto.response;

public record CustomerResponse(
        Integer id,
        String fullName,
        String phoneNumber,
        String email
) {}
