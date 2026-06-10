package org.nulp.backend.dto.response;

public record MissingComponentResponse(
        Integer componentId,
        String componentModel,
        String categoryName,
        String manufacturer,
        Integer requiredQuantity,
        String otherBranchAddress,
        Integer quantityInOtherBranch
) {}
