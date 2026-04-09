package org.nulp.backend.repository;

import org.nulp.backend.entity.Repair;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RepairRepository extends JpaRepository<Repair, Integer> {

    boolean existsByOrderOrderNumber(String orderNumber);

    @Query("""
            SELECT r FROM Repair r
            LEFT JOIN FETCH r.repairStatus
            LEFT JOIN FETCH r.repairPriority
            WHERE r.id = :repairId
              AND r.order.orderNumber = :orderNumber
            """)
    Optional<Repair> findByIdAndOrderNumber(
            @Param("repairId") Integer repairId,
            @Param("orderNumber") String orderNumber
    );

    @Query("""
            SELECT r FROM Repair r
            LEFT JOIN FETCH r.repairStatus
            LEFT JOIN FETCH r.repairPriority
            WHERE r.order.orderNumber = :orderNumber
            ORDER BY r.id ASC
            """)
    List<Repair> findByOrderNumberWithDetails(@Param("orderNumber") String orderNumber);

    Optional<Repair> findById(Integer id);

    boolean existsByOrderOrderNumberAndRepairStatusRepairStatusName(String orderNumber, String statusName);
}
