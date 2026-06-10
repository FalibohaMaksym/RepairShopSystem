package org.nulp.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SupplyResponse(
        Integer id,
        String invoiceNumber,
        LocalDateTime deliveryDateTime,
        String receivedBy,
        BigDecimal deliverySum,
        List<SupplyItem> items
) {
    public record SupplyItem(
            Integer orderItemId,
            String componentModel,
            String componentCategory,
            String producer,
            BigDecimal unitPrice,
            Integer quantity
    ) {}
}
