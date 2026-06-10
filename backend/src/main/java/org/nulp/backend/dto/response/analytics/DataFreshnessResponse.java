package org.nulp.backend.dto.response.analytics;

import java.time.LocalDateTime;

public record DataFreshnessResponse(LocalDateTime lastLoadDatetime) {}
