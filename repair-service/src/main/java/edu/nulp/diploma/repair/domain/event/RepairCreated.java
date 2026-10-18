package edu.nulp.diploma.repair.domain.event;

import java.time.Instant;

public final class RepairCreated implements RepairEvent {

    private Long repairOrderId;
    private String customerDeviceSerialNumber;
    private String problem;
    private Instant occurredAt;

    public RepairCreated(Long id, String customerDeviceSerialNumber, String problem, Instant occurredAt) {
        this.repairOrderId = id;
        this.customerDeviceSerialNumber = customerDeviceSerialNumber;
        this.problem = problem;
        this.occurredAt = occurredAt;
    }

    @Override
    public Long getRepairOrderId() {
        return repairOrderId;
    }

    @Override
    public String getRoutingKey() {
        return "repair.created";
    }

    public String getCustomerDeviceSerialNumber() {
        return customerDeviceSerialNumber;
    }

    public String getProblem() {
        return problem;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

}
