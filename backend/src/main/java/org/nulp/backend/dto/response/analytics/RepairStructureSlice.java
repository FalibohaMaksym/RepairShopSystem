package org.nulp.backend.dto.response.analytics;

import java.math.BigDecimal;

/**
 * Donut Chart — структура послуг по категоріях (частка у %).
 * quantity та totalRevenue — для інформативного тултіпу.
 */
public record RepairStructureSlice(
        String category,
        BigDecimal sharePercent,
        int quantity,
        BigDecimal totalRevenue
) {}
