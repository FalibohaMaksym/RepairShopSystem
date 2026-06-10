package org.nulp.backend.dto.response;

import java.util.List;

public record RepairResponse(
        Integer id,
        String priority,
        List<RepairListItemResponse.ServiceItem> services
) {}
