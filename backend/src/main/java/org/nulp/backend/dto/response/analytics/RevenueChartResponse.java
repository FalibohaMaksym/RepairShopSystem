package org.nulp.backend.dto.response.analytics;

import java.math.BigDecimal;
import java.util.List;

/**
 * Stacked Bar / Line Chart — динаміка доходу ремонтних послуг.
 * labels — список періодів (наприклад "2025-01", "2025-Q2", "2026").
 * series — одна серія на кожну категорію послуг або відділення.
 */
public record RevenueChartResponse(
        List<String> labels,
        List<Series> series
) {
    public record Series(String name, List<BigDecimal> values) {}
}
