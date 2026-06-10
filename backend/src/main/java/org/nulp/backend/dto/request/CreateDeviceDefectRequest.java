package org.nulp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDeviceDefectRequest(
        @NotBlank @Size(max = 70) String name
) {}
