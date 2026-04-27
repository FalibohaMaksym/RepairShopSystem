package org.nulp.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ComponentOrderResponse(
        Integer id,
        String orderNumber,
        LocalDate createdAt,
        LocalDate expectedExecutionDate,
        BigDecimal estimatedSum,
        String statusName,
        String supplierName,
        List<ItemResponse> items
) {
    public record ItemResponse(
            Integer id,
            Integer componentId,
            String componentModel,
            Integer quantity,
            BigDecimal unitPrice
    ) {}
}
