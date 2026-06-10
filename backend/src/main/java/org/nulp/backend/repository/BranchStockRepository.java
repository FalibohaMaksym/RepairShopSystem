package org.nulp.backend.repository;

import org.nulp.backend.entity.BranchStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BranchStockRepository extends JpaRepository<BranchStock, Integer> {

    @Query("""
            SELECT bs FROM BranchStock bs
            JOIN FETCH bs.branch
            JOIN FETCH bs.component c
            LEFT JOIN FETCH c.producer
            LEFT JOIN FETCH c.componentCategory
            WHERE (:branchId IS NULL OR bs.branch.id = :branchId)
            ORDER BY bs.branch.id ASC, c.componentModel ASC
            """)
    List<BranchStock> findAllWithDetails(@Param("branchId") Integer branchId);

    @Query("""
            SELECT bs FROM BranchStock bs
            JOIN FETCH bs.component c
            LEFT JOIN FETCH c.producer
            LEFT JOIN FETCH c.componentCategory
            WHERE bs.branch.id = :branchId AND bs.component.id = :componentId
            """)
    Optional<BranchStock> findByBranchIdAndComponentId(
            @Param("branchId") Integer branchId,
            @Param("componentId") Integer componentId
    );
}
