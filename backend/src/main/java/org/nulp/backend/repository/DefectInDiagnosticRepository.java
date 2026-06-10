package org.nulp.backend.repository;

import org.nulp.backend.entity.DefectInDiagonstic;
import org.nulp.backend.entity.DefectInDiagonsticId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DefectInDiagnosticRepository extends JpaRepository<DefectInDiagonstic, DefectInDiagonsticId> {

    @Query("""
            SELECT did FROM DefectInDiagonstic did
            JOIN FETCH did.deviceDefect
            WHERE did.diagnostic.id = :diagnosticId
            """)
    List<DefectInDiagonstic> findByDiagnosticIdWithDefect(@Param("diagnosticId") Integer diagnosticId);

    @Modifying
    @Query("DELETE FROM DefectInDiagonstic did WHERE did.diagnostic.id = :diagnosticId")
    void deleteByDiagnosticId(@Param("diagnosticId") Integer diagnosticId);

    @Query("SELECT COUNT(did) FROM DefectInDiagonstic did WHERE did.deviceDefect.id = :defectId")
    long countByDeviceDefectId(@Param("defectId") Short defectId);

    @Modifying
    @Query("DELETE FROM DefectInDiagonstic did WHERE did.deviceDefect.id = :defectId")
    void deleteByDeviceDefectId(@Param("defectId") Short defectId);
}
