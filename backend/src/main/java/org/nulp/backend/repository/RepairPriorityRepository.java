package org.nulp.backend.repository;

import org.nulp.backend.entity.RepairPriority;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepairPriorityRepository extends JpaRepository<RepairPriority, Short> {
}
