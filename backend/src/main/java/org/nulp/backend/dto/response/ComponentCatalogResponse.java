package org.nulp.backend.dto.response;

import java.math.BigDecimal;

public record ComponentCatalogResponse(
        Integer id,
        String name,
        BigDecimal price,
        Integer producerId,
        String producerName,
        Short categoryId,
        String categoryName,
        Integer warrantyPeriod
) {}
