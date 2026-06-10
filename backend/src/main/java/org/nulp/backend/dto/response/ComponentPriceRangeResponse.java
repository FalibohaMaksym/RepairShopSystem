package org.nulp.backend.dto.response;

import java.math.BigDecimal;

public record ComponentPriceRangeResponse(BigDecimal minPrice, BigDecimal maxPrice) {}
