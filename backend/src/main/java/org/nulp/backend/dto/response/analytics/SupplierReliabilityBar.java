package org.nulp.backend.dto.response.analytics;

import java.math.BigDecimal;

/**
 * Bar Chart — надійність постачальників.
 * Середня затримка та середній % від замовлення по постачальнику.
 */
public record SupplierReliabilityBar(
        String supplier,
        BigDecimal avgLatency,
        BigDecimal avgPercentFromOrder
) {}
