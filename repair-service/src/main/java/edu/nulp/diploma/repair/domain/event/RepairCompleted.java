package edu.nulp.diploma.repair.domain.event;

import java.math.BigDecimal;
import java.time.Instant;

public final class RepairCompleted implements RepairEvent{

    private Long repairOrderId;
    private BigDecimal price;
    private Instant occurredAt;

    public RepairCompleted(Long repairOrderId, BigDecimal price, Instant occurredAt) {
        this.repairOrderId = repairOrderId;
        this.price = price;
        this.occurredAt = occurredAt;
    }

    @Override
    public Long getRepairOrderId() {
        return repairOrderId;
    }

    @Override
    public String getRoutingKey() {
        return "repair.completed";
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
