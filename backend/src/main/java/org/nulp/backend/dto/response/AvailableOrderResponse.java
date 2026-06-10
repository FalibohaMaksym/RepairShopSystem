package org.nulp.backend.dto.response;

import java.time.LocalDateTime;

public record AvailableOrderResponse(
        String orderNumber,
        String orderStatus,
        LocalDateTime orderCreationTime,
        String deviceModel,
        String producer,
        String deviceType,
        String problemDescription,
        String diagnosticReason,
        String diagnosticSolution,
        LocalDateTime diagnosticFinishedAt
) {}
