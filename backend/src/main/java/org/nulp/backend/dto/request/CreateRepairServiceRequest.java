package org.nulp.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Або workerServiceId (послуга з конкретним майстром),
 * або serviceId (послуга без призначеного майстра).
 */
public record CreateRepairServiceRequest(
        Integer workerServiceId,
        Integer serviceId,
        List<ComponentItem> components
) {
    public record ComponentItem(
            @NotNull Integer componentId,
            @NotNull Integer quantity
    ) {}
}
