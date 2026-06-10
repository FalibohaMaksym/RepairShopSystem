package org.nulp.backend.dto.response.analytics;

public record AvailableYearsResponse(
        int minYear,
        int maxYear
) {}
