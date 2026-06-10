package org.nulp.backend.repository;

import org.nulp.backend.entity.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WorkerRepository extends JpaRepository<Worker, Integer> {

    @Query("SELECT w FROM Worker w JOIN FETCH w.branch WHERE w.id = :id")
    Optional<Worker> findByIdWithBranch(@Param("id") Integer id);

    @Query("SELECT w FROM Worker w LEFT JOIN FETCH w.position LEFT JOIN FETCH w.branch ORDER BY w.workerFullName")
    List<Worker> findAllWithDetails();

    @Query("SELECT w FROM Worker w LEFT JOIN FETCH w.position LEFT JOIN FETCH w.branch WHERE LOWER(w.workerFullName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(w.workerEmail) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY w.workerFullName")
    List<Worker> searchWithDetails(@Param("query") String query);
}
