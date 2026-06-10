package org.nulp.backend.repository;

import org.nulp.backend.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderStatusRepository extends JpaRepository<OrderStatus, Short> {

    Optional<OrderStatus> findByOrderStatusName(String orderStatusName);
}
