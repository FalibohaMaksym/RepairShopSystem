package org.nulp.backend.repository;

import org.nulp.backend.entity.Diagnostic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DiagnosticRepository extends JpaRepository<Diagnostic, Integer> {

    boolean existsByOrderOrderNumber(String orderNumber);

    @Query("""
            SELECT d FROM Diagnostic d
            LEFT JOIN FETCH d.worker
            WHERE d.order.orderNumber = :orderNumber
            """)
    Optional<Diagnostic> findByOrderNumberWithWorker(@Param("orderNumber") String orderNumber);
}
