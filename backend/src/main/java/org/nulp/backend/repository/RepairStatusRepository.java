package org.nulp.backend.repository;

import org.nulp.backend.entity.RepairStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RepairStatusRepository extends JpaRepository<RepairStatus, Short> {

    Optional<RepairStatus> findByRepairStatusName(String repairStatusName);
}
