package org.nulp.backend.repository;

import org.nulp.backend.entity.ComponentOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ComponentOrderStatusRepository extends JpaRepository<ComponentOrderStatus, Integer> {

    Optional<ComponentOrderStatus> findByComponentOrderStatusName(String name);
}
