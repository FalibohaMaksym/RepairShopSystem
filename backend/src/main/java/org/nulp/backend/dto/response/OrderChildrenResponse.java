package org.nulp.backend.dto.response;

public record OrderChildrenResponse(
        boolean hasDiagnostic,
        boolean hasRepair
) {}
