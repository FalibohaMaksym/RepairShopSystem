package org.nulp.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateSupplyRequest(
        @NotBlank @Size(min = 10, max = 10) String invoiceNumber,
        @NotEmpty @Valid List<SupplyItem> items
) {
    public record SupplyItem(
            @NotNull Integer orderItemId,
            @NotNull @Min(1) Integer quantity
    ) {}
}
