package org.nulp.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RepairListItemResponse(
        Integer id,
        String statusName,
        Short priorityId,
        String priorityValue,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        List<ServiceItem> services
) {
    public record ServiceItem(
            Integer id,
            String name,
            String workerFullName,
            LocalDateTime startedAt,
            LocalDateTime finishedAt,
            List<ComponentItem> components
    ) {}

    public record ComponentItem(
            Integer id,
            String name,
            String producerName,
            String categoryName,
            BigDecimal price,
            Short requiredQuantity,
            Integer stockQuantity
    ) {}
}
