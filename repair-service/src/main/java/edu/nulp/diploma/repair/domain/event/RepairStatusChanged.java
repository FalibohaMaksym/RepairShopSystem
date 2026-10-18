package edu.nulp.diploma.repair.domain.event;

import edu.nulp.diploma.repair.domain.RepairOrderStatus;

import java.time.Instant;

public final class RepairStatusChanged implements RepairEvent {

    private Long repairOrderId;
    private RepairOrderStatus oldStatus;
    private RepairOrderStatus newStatus;
    private Instant occurredAt;

    public RepairStatusChanged(Long repairOrderId, RepairOrderStatus oldStatus, RepairOrderStatus newStatus, Instant occurredAt) {
        this.repairOrderId = repairOrderId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.occurredAt = occurredAt;
    }

    @Override
    public Long getRepairOrderId() {
        return repairOrderId;
    }

    @Override
    public String getRoutingKey() {
        return "repair.status_changed";
    }

    public RepairOrderStatus getNewStatus() {
        return newStatus;
    }
    public RepairOrderStatus getOldStatus() {
        return oldStatus;
    }
    public Instant getOccurredAt() {return occurredAt;}

}
