package org.nulp.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSupplierRequest(
        @NotBlank @Size(max = 70) String companyName,
        @Size(max = 15) String phone,
        @Email @Size(max = 70) String email
) {}
