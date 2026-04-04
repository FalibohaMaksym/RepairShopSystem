package org.nulp.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "DefectInDiagonstic", schema = "dbo")
public class DefectInDiagonstic {
    @EmbeddedId
    private DefectInDiagonsticId id;

    @MapsId("diagnosticId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "DiagnosticId", nullable = false)
    private Diagnostic diagnostic;

    @MapsId("deviceDefectId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "DeviceDefectId", nullable = false)
    private DeviceDefect deviceDefect;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}