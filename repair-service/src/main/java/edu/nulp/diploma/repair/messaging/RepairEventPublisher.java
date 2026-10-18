package edu.nulp.diploma.repair.messaging;

import edu.nulp.diploma.repair.domain.event.RepairEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class RepairEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public RepairEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(RepairEvent e) {
        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, e.getRoutingKey(), e, m -> {
            m.getMessageProperties().setHeader("EventType", e.getClass().getSimpleName());
            return m;
        });
    }
}
