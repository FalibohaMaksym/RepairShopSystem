package org.nulp.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UpdateComponentOrderRequest(
        @NotNull Integer supplierId,
        @Future LocalDate expectedExecutionDate,
        @NotEmpty @Valid List<OrderItem> items
) {
    public record OrderItem(
            @NotNull Integer componentId,
            @NotNull @Min(1) Integer quantity,
            @NotNull @DecimalMin("0.01") BigDecimal unitPrice
    ) {}
}
