package org.nulp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateCustomerDeviceRequest(
        @NotNull @Size(max = 20) String deviceSerialNumber,
        @NotBlank String externalConditionDescription,
        Integer deviceUsageTime,
        String deviceAdditionalInfo,
        @NotNull Integer deviceId
) {
}
