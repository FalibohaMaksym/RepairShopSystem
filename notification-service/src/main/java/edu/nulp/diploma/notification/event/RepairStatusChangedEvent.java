package edu.nulp.diploma.notification.event;

public record RepairStatusChangedEvent (Long repairOrderId, String oldStatus, String newStatus) { }
