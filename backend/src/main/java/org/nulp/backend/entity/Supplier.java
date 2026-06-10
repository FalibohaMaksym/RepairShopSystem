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
@Table(name = "Supplier", schema = "dbo")
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SupplierPK", nullable = false)
    private Integer id;

    @Size(max = 70)
    @Nationalized
    @Column(name = "CompanyName", length = 70)
    private String companyName;

    @Size(max = 15)
    @Column(name = "SupplierPhone", length = 15)
    private String supplierPhone;

    @Size(max = 70)
    @Column(name = "SupplierEmail", length = 70)
    private String supplierEmail;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}