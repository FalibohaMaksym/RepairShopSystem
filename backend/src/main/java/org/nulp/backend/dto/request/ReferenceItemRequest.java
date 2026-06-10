package org.nulp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Уніфікований запит для простих довідників (тільки назва).
 */
public record ReferenceItemRequest(
        @NotBlank @Size(max = 70) String name
) {}
