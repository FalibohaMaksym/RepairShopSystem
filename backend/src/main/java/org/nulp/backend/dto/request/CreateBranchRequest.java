package org.nulp.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBranchRequest(
        @NotBlank @Size(max = 100) String address,
        @Size(max = 15) String phoneNumber,
        @Email @Size(max = 70) String email
) {}
