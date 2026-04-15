package org.nulp.backend.dto.response;

public record DeviceResponse(
        Integer id,
        String deviceModel,
        String deviceType,
        String producer,
        String devicePurpose
) {
}
