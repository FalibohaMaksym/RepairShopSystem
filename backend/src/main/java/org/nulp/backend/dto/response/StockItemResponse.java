package org.nulp.backend.dto.response;

import java.math.BigDecimal;

public record StockItemResponse(
        Integer id,
        Integer branchId,
        String branchAddress,
        Integer componentId,
        String componentModel,
        String producerName,
        String categoryName,
        BigDecimal price,
        Integer currentQuantity
) {}
