package org.nulp.backend.dto.response.analytics;

import java.math.BigDecimal;

/**
 * Scatter Plot — аналіз затримок поставок.
 * X — об'єм поставки, Y — затримка в днях, color — постачальник.
 * orderNumber — читабельний ідентифікатор замовлення для тултіпу.
 */
public record SupplyLatencyPoint(
        int supplyKey,
        String orderNumber,
        String supplier,
        BigDecimal volume,
        int latency
) {}
