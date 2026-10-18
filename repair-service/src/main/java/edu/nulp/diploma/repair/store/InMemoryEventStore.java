package edu.nulp.diploma.repair.store;

import edu.nulp.diploma.repair.domain.event.RepairEvent;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryEventStore implements EventStore {

    private final Map<Long, List<RepairEvent>> store = new ConcurrentHashMap<>();

    @Override
    public List<RepairEvent> getEvents(Long repairOrderId) {
        List<RepairEvent> events = store.get(repairOrderId);
        if (events == null) {
            return Collections.emptyList();
        }
        synchronized (events) {
            return List.copyOf(events);
        }
    }

    @Override
    public void addEvents(Long repairOrderId, List<RepairEvent> newEvents) {

        List<RepairEvent> events = store.computeIfAbsent(repairOrderId, k  -> new ArrayList<>());

        synchronized (events) {
            events.addAll(newEvents);
        }

    }

    @Override
    public boolean exists(Long repairOrderId) {
        return store.containsKey(repairOrderId);
    }
}
