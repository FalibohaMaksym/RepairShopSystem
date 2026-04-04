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
@Table(name = "ComponentOrderStatus", schema = "dbo")
public class ComponentOrderStatus {
    @Id
    @Column(name = "ComponentOrderStatusPK", nullable = false)
    private Integer id;

    @Size(max = 15)
    @Nationalized
    @Column(name = "ComponentOrderStatusName", length = 15)
    private String componentOrderStatusName;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}