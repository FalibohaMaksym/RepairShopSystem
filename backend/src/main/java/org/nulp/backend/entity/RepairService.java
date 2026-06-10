package org.nulp.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "RepairService", schema = "dbo")
public class RepairService {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RepairServicePK", nullable = false)
    private Integer id;

    @Column(name = "RepairServiceStartedAt")
    private LocalDateTime repairServiceStartedAt;

    @Column(name = "RepairServiceFinishedAt")
    private LocalDateTime repairServiceFinishedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RepairId")
    private Repair repair;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WorkerServiceId")
    private WorkerService workerService;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}