package edu.nulp.diploma.projection.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RepairCompletedEvent(Long repairOrderId, BigDecimal price) {}
