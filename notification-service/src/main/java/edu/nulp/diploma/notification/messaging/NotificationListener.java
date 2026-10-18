package edu.nulp.diploma.notification.messaging;

import edu.nulp.diploma.notification.event.RepairCompletedEvent;
import edu.nulp.diploma.notification.event.RepairStatusChangedEvent;
import edu.nulp.diploma.notification.service.NotificationSender;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@Component
public class NotificationListener {

    private final NotificationSender sender;
    private final ObjectMapper mapper;

    public NotificationListener(NotificationSender sender) {
        this.sender = sender;
        this.mapper = new ObjectMapper();
    }

    @RabbitListener(queues = RabbitConfig.QUEUE)
    public void handle(Message message) throws IOException {
        String type = (String) message.getMessageProperties().getHeader("EventType");
        byte[] body = message.getBody();

        switch (type) {
            case "RepairStatusChanged" -> {
                var e = mapper.readValue(body, RepairStatusChangedEvent.class);
                sender.send(e.repairOrderId(), "статус змінено: " + e.oldStatus() + " → " + e.newStatus());
            }
            case "RepairCompleted" -> {
                var e = mapper.readValue(body, RepairCompletedEvent.class);
                sender.send(e.repairOrderId(), "ремонт завершено, вартість: " + e.price());
            }
            default -> throw new IllegalArgumentException("Unexpected event type");
        }
    }
}
