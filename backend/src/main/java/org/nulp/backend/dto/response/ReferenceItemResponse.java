package org.nulp.backend.dto.response;

/**
 * Уніфікована відповідь для простих довідників (id + name).
 * id — Number, щоб підтримати як Integer так і Short.
 */
public record ReferenceItemResponse(Number id, String name) {}
