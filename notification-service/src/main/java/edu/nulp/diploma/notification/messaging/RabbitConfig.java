package edu.nulp.diploma.notification.messaging;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    public static final String EXCHANGE = "repair.exchange";
    public static final String QUEUE = "repair.notification.queue";

    @Bean
    TopicExchange repairExchange() { return new TopicExchange(EXCHANGE); }

    @Bean
    Queue notificationQueue() { return QueueBuilder.durable(QUEUE).build(); }

    @Bean
    Binding statusChangedBinding(Queue notificationQueue, TopicExchange repairExchange) {
        return BindingBuilder.bind(notificationQueue).to(repairExchange).with("repair.status_changed");
    }

    @Bean
    Binding completedBinding(Queue notificationQueue, TopicExchange repairExchange) {
        return BindingBuilder.bind(notificationQueue).to(repairExchange).with("*.completed");
    }
}