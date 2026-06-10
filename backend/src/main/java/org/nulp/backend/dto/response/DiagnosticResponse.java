package org.nulp.backend.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record DiagnosticResponse(
        Integer id,
        String defectReason,
        String defectSolution,
        LocalDateTime diagnosticStartedAt,
        LocalDateTime diagnosticFinishedAt,
        Integer workerId,
        String workerFullName,
        List<DefectResponse> defects
) {
    public record DefectResponse(Short id, String name) {}
}
