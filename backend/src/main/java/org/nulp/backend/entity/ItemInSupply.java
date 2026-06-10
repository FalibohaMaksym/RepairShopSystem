package org.nulp.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "ItemInSupply", schema = "dbo")
public class ItemInSupply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ItemInSupplyPK", nullable = false)
    private Integer id;

    @Column(name = "ItemInSupplyQuantity")
    private Integer itemInSupplyQuantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ItemInComponentOrderId")
    private ItemInComponentOrder itemInComponentOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SupplyId")
    private Supply supply;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BranchStockId")
    private BranchStock branchStock;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}