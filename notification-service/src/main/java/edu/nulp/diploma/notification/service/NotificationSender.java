package edu.nulp.diploma.notification.service;

public interface NotificationSender {
    void send(Long repairOrderId, String message);
}
