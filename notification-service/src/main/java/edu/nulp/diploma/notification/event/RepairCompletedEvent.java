package edu.nulp.diploma.notification.event;

import java.math.BigDecimal;

public record RepairCompletedEvent (Long repairOrderId, BigDecimal price) { }
