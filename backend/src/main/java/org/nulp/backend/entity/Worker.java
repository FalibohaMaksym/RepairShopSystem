package org.nulp.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "Worker", schema = "dbo")
public class Worker {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "WorkerPK", nullable = false)
    private Integer id;

    @Size(max = 70)
    @Nationalized
    @Column(name = "WorkerFullName", length = 70)
    private String workerFullName;

    @Size(max = 15)
    @Column(name = "WorkerPhoneNumber", length = 15)
    private String workerPhoneNumber;

    @Size(max = 70)
    @Column(name = "WorkerEmail", length = 70)
    private String workerEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PositionId")
    private Position position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BranchId")
    private Branch branch;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}