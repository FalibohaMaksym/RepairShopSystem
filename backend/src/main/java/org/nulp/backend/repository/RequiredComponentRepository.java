package org.nulp.backend.repository;

import org.nulp.backend.entity.RequiredComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RequiredComponentRepository extends JpaRepository<RequiredComponent, Integer> {

    @Query("""
            SELECT rc FROM RequiredComponent rc
            JOIN FETCH rc.branchStock bs
            JOIN FETCH bs.component c
            LEFT JOIN FETCH c.producer
            LEFT JOIN FETCH c.componentCategory
            WHERE rc.repairService.id = :repairServiceId
            """)
    List<RequiredComponent> findByRepairServiceIdWithDetails(@Param("repairServiceId") Integer repairServiceId);

    @Modifying
    @Query("DELETE FROM RequiredComponent rc WHERE rc.repairService.id = :repairServiceId")
    void deleteByRepairServiceId(@Param("repairServiceId") Integer repairServiceId);
}
