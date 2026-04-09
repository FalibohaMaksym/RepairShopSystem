package org.nulp.backend.repository;

import org.nulp.backend.entity.RepairService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RepairServiceRepository extends JpaRepository<RepairService, Integer> {

    @Query("""
            SELECT rs FROM RepairService rs
            JOIN FETCH rs.workerService ws
            LEFT JOIN FETCH ws.worker
            JOIN FETCH ws.service
            WHERE rs.repair.id = :repairId
            ORDER BY rs.id ASC
            """)
    List<RepairService> findByRepairIdWithDetails(@Param("repairId") Integer repairId);

    boolean existsByRepairIdAndRepairServiceStartedAtIsNotNullAndRepairServiceFinishedAtIsNull(Integer repairId);

    // Заплановані (ще не розпочаті) послуги з призначеним майстром
    boolean existsByRepairIdAndRepairServiceStartedAtIsNullAndWorkerServiceWorkerIsNotNull(Integer repairId);

    // Заплановані (ще не розпочаті) послуги без майстра
    boolean existsByRepairIdAndRepairServiceStartedAtIsNullAndWorkerServiceWorkerIsNull(Integer repairId);

    @Query("""
            SELECT rs FROM RepairService rs
            JOIN FETCH rs.workerService ws
            LEFT JOIN FETCH ws.worker
            JOIN FETCH ws.service
            WHERE rs.id = :serviceId
              AND rs.repair.id = :repairId
              AND rs.repair.order.orderNumber = :orderNumber
            """)
    Optional<RepairService> findByIdAndContext(
            @Param("serviceId") Integer serviceId,
            @Param("repairId") Integer repairId,
            @Param("orderNumber") String orderNumber
    );
}
