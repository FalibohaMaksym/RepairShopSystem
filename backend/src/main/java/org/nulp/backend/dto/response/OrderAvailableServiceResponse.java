package org.nulp.backend.dto.response;

import java.math.BigDecimal;

public record OrderAvailableServiceResponse(
        Integer serviceId,
        String serviceName,
        BigDecimal estimatedPrice,
        String categoryName,
        String complexityValue,
        String deviceTypeName
) {
}
