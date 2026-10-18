package edu.nulp.diploma.projection.messaging;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "repair.exchange";
    public static final String PROJECTION_QUEUE = "repair.projection.queue";

    @Bean
    TopicExchange repairExchange() { return new TopicExchange(EXCHANGE); }

    @Bean
    Queue projectionQueue() { return QueueBuilder.durable(PROJECTION_QUEUE).build(); }

    @Bean
    Binding projectionBinding(Queue projectionQueue, TopicExchange repairExchange) {
        return BindingBuilder.bind(projectionQueue).to(repairExchange).with("repair.#");
    }

}
