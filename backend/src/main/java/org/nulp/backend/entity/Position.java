package org.nulp.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
@Table(name = "\"Position\"", schema = "dbo")
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PositionPK", columnDefinition = "tinyint not null")
    private Short id;

    @Size(max = 30)
    @Nationalized
    @Column(name = "PositionName", length = 30)
    private String positionName;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}