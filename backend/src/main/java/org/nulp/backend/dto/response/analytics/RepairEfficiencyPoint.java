package org.nulp.backend.dto.response.analytics;

import java.math.BigDecimal;

/**
 * Scatter Plot — матриця ефективності ремонтних послуг.
 * X — кількість послуг, Y — прибутковість за годину.
 * totalRevenue — для інформативного тултіпу.
 */
public record RepairEfficiencyPoint(
        String label,
        int quantity,
        BigDecimal hourlyYield,
        BigDecimal totalRevenue
) {}
