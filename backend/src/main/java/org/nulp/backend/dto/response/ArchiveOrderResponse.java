package org.nulp.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ArchiveOrderResponse(
        String orderNumber,
        String orderStatus,
        LocalDateTime orderCreationTime,
        BigDecimal orderEstimatedPrice,
        String problemDescription,
        String deviceSerialNumber,
        String deviceModel,
        String producer,
        String deviceType,
        String customerName,
        String customerPhone
) {}
