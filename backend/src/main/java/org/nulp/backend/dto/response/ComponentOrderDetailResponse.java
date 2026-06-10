package org.nulp.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ComponentOrderDetailResponse(
        Integer id,
        String orderNumber,
        LocalDate orderDate,
        LocalDate expectedExecutionDate,
        String supplierName,
        String status,
        List<OrderItem> items
) {
    public record OrderItem(
            Integer id,
            Integer componentId,
            String componentModel,
            String componentCategory,
            String producer,
            Integer orderedQuantity,
            BigDecimal unitPrice,
            Integer suppliedQuantity
    ) {}
}
