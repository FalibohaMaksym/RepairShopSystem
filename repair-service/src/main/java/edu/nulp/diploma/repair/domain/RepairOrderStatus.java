package edu.nulp.diploma.repair.domain;

public enum RepairOrderStatus {
    NEW,
    DIAGNOSTIC,
    WAITING_FOR_CONFIRMATION,
    WAITING_FOR_REPAIR,
    IN_REPAIR,
    READY,
    COMPLETED,
    CANCELLED
}
