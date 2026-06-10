package org.nulp.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record TransferRequest(
        @NotNull Integer fromBranchId,
        Integer toBranchId,
        @NotNull Integer componentId,
        @NotNull @Min(1) Integer quantity
) {}
