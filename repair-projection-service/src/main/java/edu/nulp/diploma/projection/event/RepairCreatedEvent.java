package edu.nulp.diploma.projection.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RepairCreatedEvent(Long repairOrderId, String customerDeviceSerialNumber, String problem) {}

