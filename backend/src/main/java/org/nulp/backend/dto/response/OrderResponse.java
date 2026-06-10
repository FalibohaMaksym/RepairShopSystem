package org.nulp.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderResponse(
        Integer id,
        String orderNumber,
        String orderStatus,
        BigDecimal orderEstimatedPrice,
        LocalDateTime orderCreationTime,
        String problemDescription,
        String workerFullName,
        String deviceModel,
        String deviceSerialNumber,
        String customerFullName
) {
}
