package org.nulp.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(

        @NotBlank
        @Size(max = 70)
        String fullName,

        @NotBlank
        @Size(max = 15)
        String phoneNumber,

        @Email
        @Size(max = 70)
        String email,

        Short positionId,

        @NotNull
        Integer branchId,

        @NotBlank
        String password,

        @NotNull
        Integer roleId
) {}
