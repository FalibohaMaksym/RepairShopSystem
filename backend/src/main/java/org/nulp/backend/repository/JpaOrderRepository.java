package org.nulp.backend.repository;

import org.nulp.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JpaOrderRepository extends JpaRepository<Order, Integer> {

    @Query("SELECT MAX(o.orderNumber) FROM Order o WHERE o.orderNumber LIKE 'OR%'")
    Optional<String> findMaxOrderNumber();

    boolean existsByCustomerDeviceId(Integer customerDeviceId);

    boolean existsByOrderNumber(String orderNumber);

    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.orderStatus os
            JOIN FETCH o.worker w
            LEFT JOIN FETCH w.branch
            JOIN FETCH o.customerDevice cd
            JOIN FETCH cd.customer
            JOIN FETCH cd.device d
            JOIN FETCH d.deviceType
            JOIN FETCH d.producer
            WHERE (
                EXISTS (
                    SELECT diag FROM Diagnostic diag
                    WHERE diag.order = o
                      AND diag.worker.id = :workerId
                      AND diag.diagnosticFinishedAt IS NULL
                )
                OR EXISTS (
                    SELECT rs FROM RepairService rs
                    WHERE rs.repair.order = o
                      AND rs.workerService.worker.id = :workerId
                      AND rs.repairServiceFinishedAt IS NULL
                )
                OR EXISTS (
                    SELECT r FROM Repair r
                    WHERE r.order = o
                      AND r.repairStartedAt IS NOT NULL
                      AND r.repairFinishedAt IS NULL
                      AND EXISTS (
                          SELECT rs FROM RepairService rs
                          WHERE rs.repair = r
                            AND rs.workerService.worker.id = :workerId
                      )
                )
            )
            ORDER BY o.orderCreationTime ASC
            """)
    List<Order> findInProgressByWorker(@Param("workerId") Integer workerId);

    @Query("SELECT o FROM Order o WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumber(@Param("orderNumber") String orderNumber);

    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.orderStatus
            JOIN FETCH o.worker w
            LEFT JOIN FETCH w.branch
            JOIN FETCH o.customerDevice cd
            JOIN FETCH cd.customer
            JOIN FETCH cd.device d
            JOIN FETCH d.deviceType
            JOIN FETCH d.producer
            WHERE o.orderNumber = :orderNumber
            """)
    Optional<Order> findByOrderNumberWithDetails(@Param("orderNumber") String orderNumber);
}
