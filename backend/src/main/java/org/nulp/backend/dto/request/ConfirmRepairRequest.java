package org.nulp.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ConfirmRepairRequest(
        @NotEmpty List<@NotNull @Valid RepairItem> repairs
) {
    public record RepairItem(
            @NotNull Short priorityId,
            List<@Valid ServiceItem> services
    ) {}

    /**
     * Або workerServiceId (послуга з конкретним майстром),
     * або serviceId (послуга без призначеного майстра).
     * Одне з двох обов'язкове — перевіряється на рівні сервісу.
     */
    public record ServiceItem(
            Integer workerServiceId,
            Integer serviceId,
            List<@Valid ComponentItem> components
    ) {}

    public record ComponentItem(
            @NotNull Integer componentId,
            @NotNull @Min(1) Integer quantity
    ) {}
}
