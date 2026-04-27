package org.nulp.backend.dto.response;

public record SupplierResponse(
        Integer id,
        String companyName,
        String phone,
        String email
) {}
