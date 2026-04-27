package org.nulp.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ActiveComponentOrderResponse(
        Integer id,
        String orderNumber,
        LocalDate orderDate,
        BigDecimal orderSum,
        LocalDate expectedExecutionDate,
        String status,
        List<ComponentItem> items
) {
    public record ComponentItem(
            String componentModel,
            String componentCategory,
            String producer,
            Integer orderedQuantity,
            Integer suppliedQuantity
    ) {}
}
