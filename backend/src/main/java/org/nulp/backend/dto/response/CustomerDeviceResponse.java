package org.nulp.backend.dto.response;

public record CustomerDeviceResponse(
        Integer id,
        String deviceSerialNumber,
        String externalConditionDescription,
        Integer deviceUsageTime,
        String deviceAdditionalInfo,
        Integer deviceId,
        String deviceModel,
        String producer,
        String deviceType,
        Integer customerId,
        String customerFullName
) {}
