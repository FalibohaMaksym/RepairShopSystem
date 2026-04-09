package org.nulp.backend.repository;

import org.nulp.backend.entity.WorkerService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WorkerServiceRepository extends JpaRepository<WorkerService, Integer> {

    @Query("""
            SELECT ws FROM WorkerService ws
            JOIN FETCH ws.service
            JOIN FETCH ws.worker
            WHERE ws.id = :id
            """)
    Optional<WorkerService> findByIdWithDetails(@Param("id") Integer id);

    @Query("""
            SELECT ws FROM WorkerService ws
            JOIN FETCH ws.service s
            WHERE ws.worker IS NULL AND s.id = :serviceId
            """)
    Optional<WorkerService> findUnassignedByServiceId(@Param("serviceId") Integer serviceId);

    @Query("""
            SELECT ws FROM WorkerService ws
            JOIN FETCH ws.service s
            WHERE ws.worker.id = :workerId AND s.id = :serviceId
            """)
    Optional<WorkerService> findByWorkerIdAndServiceId(
            @Param("workerId") Integer workerId,
            @Param("serviceId") Integer serviceId);

    @Query("""
            SELECT ws FROM WorkerService ws
            JOIN FETCH ws.service s
            LEFT JOIN FETCH s.serviceCategory
            LEFT JOIN FETCH s.serviceComplexity
            LEFT JOIN FETCH s.deviceType
            WHERE ws.worker.id = :workerId
            ORDER BY s.serviceName ASC
            """)
    List<WorkerService> findByWorkerIdWithServiceDetails(@Param("workerId") Integer workerId);

    @Query("""
            SELECT ws FROM WorkerService ws
            JOIN FETCH ws.service s
            LEFT JOIN FETCH s.serviceCategory
            LEFT JOIN FETCH s.serviceComplexity
            LEFT JOIN FETCH s.deviceType
            WHERE ws.worker.id = :workerId
              AND s.deviceType.id = (
                  SELECT d.deviceType.id FROM Order o
                  JOIN o.customerDevice cd
                  JOIN cd.device d
                  WHERE o.orderNumber = :orderNumber
              )
            ORDER BY s.serviceName ASC
            """)
    List<WorkerService> findByWorkerIdAndOrderDeviceType(
            @Param("workerId") Integer workerId,
            @Param("orderNumber") String orderNumber
    );
}
