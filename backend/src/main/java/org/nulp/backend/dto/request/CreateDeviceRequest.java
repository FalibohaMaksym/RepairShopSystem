package org.nulp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDeviceRequest(
        @NotBlank @Size(max = 50) String deviceModel,
        @NotNull Short deviceTypeId,
        @NotNull Integer producerId,
        Short devicePurposeId
) {
}
