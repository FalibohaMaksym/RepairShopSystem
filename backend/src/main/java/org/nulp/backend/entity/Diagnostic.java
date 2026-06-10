package org.nulp.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "Diagnostic", schema = "dbo", indexes = {
        @Index(columnList = "DefectReason")
}, uniqueConstraints = {
        @UniqueConstraint(name = "IX_Diagnostic", columnNames = {"OrderId"})
})
public class Diagnostic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DiagnosticPK", nullable = false)
    private Integer id;

    @Lob
    @Column(name = "DefectReason")
    private String defectReason;

    @Size(max = 150)
    @Nationalized
    @Column(name = "DefectSolution", length = 150)
    private String defectSolution;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "OrderId", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WorkerId")
    private Worker worker;

    @Column(name = "DiagnosticStartedAt")
    private LocalDateTime diagnosticStartedAt;

    @Column(name = "DiagnosticFinishedAt")
    private LocalDateTime diagnosticFinishedAt;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}