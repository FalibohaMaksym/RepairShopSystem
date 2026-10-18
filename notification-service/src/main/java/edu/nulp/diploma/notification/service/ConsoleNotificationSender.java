package edu.nulp.diploma.notification.service;

import org.springframework.stereotype.Component;

@Component
public class ConsoleNotificationSender implements NotificationSender {

    @Override
    public void send(Long repairOrderId, String message) {
        System.out.println("Id: " + repairOrderId + " | " + message);
    }

}
