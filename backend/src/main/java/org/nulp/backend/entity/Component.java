package org.nulp.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "Component", schema = "dbo")
public class Component {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ComponentPK", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ProducerId")
    private Producer producer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ComponentCategoryId")
    private ComponentCategory componentCategory;

    @Size(max = 40)
    @Nationalized
    @Column(name = "ComponentModel", length = 40)
    private String componentModel;

    @Column(name = "WarrantyPeriod")
    private Integer warrantyPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WarrantyObligationId")
    private WarrantyObligation warrantyObligation;

    @Column(name = "ComponentPrice", precision = 7, scale = 2)
    private BigDecimal componentPrice;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}