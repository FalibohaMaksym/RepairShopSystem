package org.nulp.backend.dto.request;

import jakarta.validation.constraints.Size;

import java.util.List;

public record CompleteDiagnosticRequest(
        String defectReason,
        @Size(max = 150) String defectSolution,
        List<Short> defectIds
) {}
