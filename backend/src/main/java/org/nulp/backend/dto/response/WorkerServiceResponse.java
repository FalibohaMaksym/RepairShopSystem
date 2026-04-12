package org.nulp.backend.dto.response;

import java.math.BigDecimal;

public record WorkerServiceResponse(
        Integer workerServiceId,
        Integer serviceId,
        String serviceName,
        BigDecimal estimatedPrice,
        String categoryName,
        String complexityValue,
        String deviceTypeName
) {}
