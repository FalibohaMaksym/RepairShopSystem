package edu.nulp.diploma.projection.messaging;

import edu.nulp.diploma.projection.event.RepairCompletedEvent;
import edu.nulp.diploma.projection.event.RepairCreatedEvent;
import edu.nulp.diploma.projection.event.RepairStatusChangedEvent;
import edu.nulp.diploma.projection.repository.RepairViewRepository;
import edu.nulp.diploma.projection.view.RepairView;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.Instant;

@Component
public class RepairProjectionListener {

    private final RepairViewRepository repairViewRepository;
    private final ObjectMapper mapper;

    public RepairProjectionListener(RepairViewRepository repairViewRepository, ObjectMapper mapper) {
        this.repairViewRepository = repairViewRepository;
        this.mapper = mapper;
    }

    @RabbitListener(queues = RabbitConfig.PROJECTION_QUEUE)
    public void handle(Message message) throws IOException {
        String type = (String) message.getMessageProperties().getHeader("EventType");
        byte[] body = message.getBody();

        switch (type) {
            case "RepairCreated" -> {
                var e = mapper.readValue(body, RepairCreatedEvent.class);
                repairViewRepository.save(new RepairView(e.repairOrderId(), e.customerDeviceSerialNumber(),
                        e.problem(), "NEW", null, Instant.now()));
            }
            case "RepairStatusChanged" -> {
                var e = mapper.readValue(body, RepairStatusChangedEvent.class);
                repairViewRepository.findById(e.repairOrderId()).ifPresentOrElse(v -> {
                    v.setStatus(e.newStatus());
                    v.setLastUpdated(Instant.now());
                }, () -> System.err.println("Подія для невідомого ремонту: " + e.repairOrderId()));
            }
            case "RepairCompleted" -> {
                var e = mapper.readValue(body, RepairCompletedEvent.class);
                repairViewRepository.findById(e.repairOrderId()).ifPresent(v -> {
                    v.setStatus("COMPLETED");
                    v.setPrice(e.price());
                    v.setLastUpdated(Instant.now());
                });
            }
            default -> System.err.println("Невідомий тип події: " + type);
        }
    }
}