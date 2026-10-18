package edu.nulp.diploma.projection.event;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RepairStatusChangedEvent(Long repairOrderId, String oldStatus, String newStatus) {}

