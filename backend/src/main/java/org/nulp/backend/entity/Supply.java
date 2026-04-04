package org.nulp.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "Supply", schema = "dbo", uniqueConstraints = {
        @UniqueConstraint(name = "UQ__Supply__D776E9817595C131", columnNames = {"InvoiceNumber"})
})
public class Supply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SupplyPK", nullable = false)
    private Integer id;

    @Size(max = 10)
    @NotNull
    @Column(name = "InvoiceNumber", nullable = false, length = 10)
    private String invoiceNumber;

    @Column(name = "SuplySumPrice", precision = 9, scale = 2)
    private BigDecimal suplySumPrice;

    @Column(name = "SupplyDateTime")
    private LocalDateTime supplyDateTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WorkerId")
    private Worker worker;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}