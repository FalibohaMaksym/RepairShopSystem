package edu.nulp.diploma.repair.store;

import edu.nulp.diploma.repair.domain.event.RepairEvent;

import java.util.List;

public interface EventStore {

    List<RepairEvent> getEvents(Long repairOrderId);
    void addEvents(Long repairOrderId, List<RepairEvent> events);
    boolean exists(Long repairOrderId);

}
