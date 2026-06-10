package org.nulp.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ActiveOrderResponse(
        String orderNumber,
        String orderStatus,
        BigDecimal orderEstimatedPrice,
        LocalDateTime orderCreationTime,
        String deviceSerialNumber,
        String deviceModel,
        String producer,
        String deviceType,
        String problemDescription
) {}
