package org.nulp.backend.dto.response.analytics;

/**
 * Відповідь після запуску ETL-процесу.
 */
public record EtlStatusResponse(
        boolean success,
        String message
) {}
