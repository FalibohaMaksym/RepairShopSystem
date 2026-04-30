package org.nulp.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateServiceRequest(
        @NotBlank @Size(max = 50) String serviceName,
        @NotNull @DecimalMin("0.01") BigDecimal estimatedPrice,
        @NotNull Integer categoryId,
        @NotNull Integer complexityId,
        @NotNull Integer deviceTypeId
) {}
