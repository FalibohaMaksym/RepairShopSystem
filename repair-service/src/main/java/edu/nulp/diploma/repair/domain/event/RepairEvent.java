package edu.nulp.diploma.repair.domain.event;

import com.fasterxml.jackson.annotation.JsonIgnore;

public sealed interface RepairEvent permits RepairCreated, RepairStatusChanged, RepairCompleted {
    Long getRepairOrderId();

    @JsonIgnore
    String getRoutingKey();
}
