package org.nulp.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateComponentRequest(
        @NotBlank @Size(max = 40) String componentModel,
        @NotNull Integer producerId,
        @NotNull Short categoryId,
        @NotNull Short warrantyObligationId,
        @NotNull @Min(0) Integer warrantyPeriod,
        @NotNull @DecimalMin("0.01") BigDecimal componentPrice
) {}
