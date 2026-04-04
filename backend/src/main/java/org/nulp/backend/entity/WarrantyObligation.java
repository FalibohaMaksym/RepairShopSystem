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
@Table(name = "WarrantyObligation", schema = "dbo")
public class WarrantyObligation {
    @Id
    @Column(name = "WarrantyObligationPK", columnDefinition = "tinyint not null")
    private Short id;

    @Size(max = 70)
    @Nationalized
    @Column(name = "ObligationDescription", length = 70)
    private String obligationDescription;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}