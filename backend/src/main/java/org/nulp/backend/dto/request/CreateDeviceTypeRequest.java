package org.nulp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDeviceTypeRequest(
        @NotBlank @Size(max = 30) String name
) {
}
