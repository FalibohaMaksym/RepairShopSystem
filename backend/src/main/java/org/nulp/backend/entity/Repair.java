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
@Table(name = "Repair", schema = "dbo")
public class Repair {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RepairPK", nullable = false)
    private Integer id;

    @Column(name = "RepairStartedAt")
    private LocalDateTime repairStartedAt;

    @Column(name = "RepairFinishedAt")
    private LocalDateTime repairFinishedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RepairStatusId")
    private RepairStatus repairStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RepairPriorityId")
    private RepairPriority repairPriority;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OrderId")
    private Order order;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}