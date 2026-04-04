package org.nulp.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "RepairPriority", schema = "dbo")
public class RepairPriority {
    @Id
    @Column(name = "RepairPriorityPK", columnDefinition = "tinyint not null")
    private Short id;

    @Size(max = 15)
    @Nationalized
    @Column(name = "RepairPriorityValue", length = 15)
    private String repairPriorityValue;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}