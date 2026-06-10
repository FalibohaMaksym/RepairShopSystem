package org.nulp.backend.dto.request;

import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(
        @NotNull Integer customerDeviceId,
        @NotNull Integer workerId,
        String problemDescription
) {
}
