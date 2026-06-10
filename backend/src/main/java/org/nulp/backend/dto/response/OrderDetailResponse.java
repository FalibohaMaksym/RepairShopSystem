package org.nulp.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderDetailResponse(
        Integer id,
        String orderNumber,
        String orderStatus,
        BigDecimal orderEstimatedPrice,
        LocalDateTime orderCreationTime,
        String problemDescription,

        // Працівник
        Integer workerId,
        String workerFullName,
        String workerPhoneNumber,
        String workerEmail,
        String branchAddress,

        // Клієнт
        Integer customerId,
        String customerFullName,
        String customerPhoneNumber,
        String customerEmail,

        // Клієнтський пристрій
        Integer customerDeviceId,
        String deviceSerialNumber,
        String externalConditionDescription,
        String deviceAdditionalInfo,

        // База пристрою
        Integer deviceId,
        String deviceModel,
        String deviceTypeName,
        String producerName
) {}
