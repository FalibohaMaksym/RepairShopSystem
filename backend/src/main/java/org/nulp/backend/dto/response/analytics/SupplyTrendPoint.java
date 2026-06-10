package org.nulp.backend.dto.response.analytics;

import java.math.BigDecimal;

/**
 * Line Chart — тренд середньої затримки поставок по місяцях.
 */
public record SupplyTrendPoint(
        String period,
        BigDecimal avgLatency
) {}
