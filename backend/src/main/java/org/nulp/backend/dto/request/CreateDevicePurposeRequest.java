package org.nulp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDevicePurposeRequest(
        @NotBlank @Size(max = 20) String name
) {
}
