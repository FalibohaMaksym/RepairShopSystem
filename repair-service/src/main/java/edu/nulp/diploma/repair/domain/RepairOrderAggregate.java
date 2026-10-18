package edu.nulp.diploma.repair.domain;

import edu.nulp.diploma.repair.domain.event.RepairCompleted;
import edu.nulp.diploma.repair.domain.event.RepairCreated;
import edu.nulp.diploma.repair.domain.event.RepairEvent;
import edu.nulp.diploma.repair.domain.event.RepairStatusChanged;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class RepairOrderAggregate {
    private Long id;
    private RepairOrderStatus status;
    private boolean isCreated;
    private final List<RepairEvent> uncommited = new ArrayList<>();

    public RepairOrderAggregate(List<RepairEvent> history) {
        history.forEach(this::apply);
    }

    public void create(Long id, String deviceSerialNumber, String problem) {
        if (isCreated) {
            throw new RuntimeException("Repair already created");
        }
        raise(new RepairCreated(id, deviceSerialNumber, problem, Instant.now()));
    }

    public void changeStatus(RepairOrderStatus newStatus) {
        if (!isCreated) {
            throw new RuntimeException("Repair isn't created");
        }
        if (status == RepairOrderStatus.COMPLETED) {
            throw new RuntimeException("Repair already completed");
        }
        raise(new RepairStatusChanged(id, status, newStatus, Instant.now()));
    }

    public void complete(BigDecimal price) {
        if (!isCreated) {
            throw new RuntimeException("Repair isn't created");
        }
        if (status == RepairOrderStatus.COMPLETED) {
            throw new RuntimeException("Repair already completed");
        }
        raise(new RepairCompleted(id, price, Instant.now()));
    }

    private void raise(RepairEvent e) {
        apply(e);
        uncommited.add(e);
    }

    private void apply(RepairEvent e) {
        switch (e) {
            case RepairCreated c -> {isCreated = true; id = c.getRepairOrderId(); status = RepairOrderStatus.NEW;}
            case RepairStatusChanged c -> status = c.getNewStatus();
            case RepairCompleted c -> status = RepairOrderStatus.COMPLETED;
        }
    }

    public List<RepairEvent> getUncommited() {
        return uncommited;
    }
}
