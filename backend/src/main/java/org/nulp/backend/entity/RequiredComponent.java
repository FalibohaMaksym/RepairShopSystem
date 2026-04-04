package org.nulp.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "RequiredComponent", schema = "dbo")
public class RequiredComponent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RequiredComponentPK", nullable = false)
    private Integer id;

    @Column(name = "ComponentAmount", columnDefinition = "tinyint")
    private Short componentAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RepairServiceId")
    private RepairService repairService;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BranchStockId")
    private BranchStock branchStock;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}