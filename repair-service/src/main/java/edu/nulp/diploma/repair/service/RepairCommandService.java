package edu.nulp.diploma.repair.service;

import edu.nulp.diploma.repair.domain.RepairOrderAggregate;
import edu.nulp.diploma.repair.domain.RepairOrderStatus;
import edu.nulp.diploma.repair.domain.event.RepairEvent;
import edu.nulp.diploma.repair.messaging.RepairEventPublisher;
import edu.nulp.diploma.repair.store.EventStore;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class RepairCommandService {

    private final EventStore eventStore;
    private final RepairEventPublisher publisher;
    private final AtomicLong idSequence = new AtomicLong(1);

    public RepairCommandService(EventStore eventStore, RepairEventPublisher publisher) {
        this.eventStore = eventStore;
        this.publisher = publisher;
    }

    public Long create(String serialNumber, String problem) {
        Long id = idSequence.getAndIncrement();
        RepairOrderAggregate aggregate = new RepairOrderAggregate(List.of());
        aggregate.create(id, serialNumber, problem);
        persistAndPublish(id, aggregate);
        return id;
    }

    public void changeStatus(Long id, RepairOrderStatus newStatus) {
        RepairOrderAggregate aggregate = load(id);
        aggregate.changeStatus(newStatus);
        persistAndPublish(id, aggregate);
    }

    public void complete(Long id, BigDecimal price) {
        RepairOrderAggregate aggregate = load(id);
        aggregate.complete(price);
        persistAndPublish(id, aggregate);
    }

    private RepairOrderAggregate load(Long id) {
        if (!eventStore.exists(id)) {
            throw new IllegalArgumentException("Aggregate doesn't exists");
        }
        return new RepairOrderAggregate(eventStore.getEvents(id));
    }

    private void persistAndPublish(Long id, RepairOrderAggregate aggregate) {
        List<RepairEvent> uncommitedEvents = List.copyOf(aggregate.getUncommited());
        eventStore.addEvents(id, uncommitedEvents);
        uncommitedEvents.forEach(publisher::publish);
    }

}
