package org.nulp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCustomerRequest(
        @NotBlank @Size(max = 70) String fullName,
        @Size(max = 15)           String phoneNumber,
        @Size(max = 70)           String email
) {}
