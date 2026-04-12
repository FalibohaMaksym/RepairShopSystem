package org.nulp.backend.dto.request;

import jakarta.validation.constraints.NotNull;

public record AddWorkerServiceRequest(
        @NotNull Integer serviceId
) {}
