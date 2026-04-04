package org.nulp.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "ComponentOrder", schema = "dbo", uniqueConstraints = {
        @UniqueConstraint(name = "UQ__Componen__F24D0C2FC3F56DF6", columnNames = {"ComponentOrderNumber"})
})
public class ComponentOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ComponentOrderPK", nullable = false)
    private Integer id;

    @Size(max = 10)
    @NotNull
    @Column(name = "ComponentOrderNumber", nullable = false, length = 10)
    private String componentOrderNumber;

    @Column(name = "ComponentOrderCreatedAt")
    private LocalDate componentOrderCreatedAt;

    @Column(name = "ExpectedExecutionDate")
    private LocalDate expectedExecutionDate;

    @Column(name = "EstimatedOrderSum", precision = 9, scale = 2)
    private BigDecimal estimatedOrderSum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SupplierId")
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WorkerId")
    private Worker worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ComponentOrderStatusId")
    private ComponentOrderStatus componentOrderStatus;

    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}