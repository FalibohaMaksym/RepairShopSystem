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
@Table(name = "\"Order\"", schema = "dbo", uniqueConstraints = {
        @UniqueConstraint(name = "IX_Order", columnNames = {"OrderNumber"})
})
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "OrderPK", nullable = false)
    private Integer id;

    @Size(max = 10)
    @NotNull
    @Column(name = "OrderNumber", nullable = false, length = 10)
    private String orderNumber;

    @Column(name = "OrderCreationTime")
    private LocalDateTime orderCreationTime;

    @Column(name = "OrderEstimatedPrice", precision = 8, scale = 2)
    private BigDecimal orderEstimatedPrice;

    @Lob
    @Column(name = "ProblemDescription")
    private String problemDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WorkerId")
    private Worker worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OrderStatusId")
    private OrderStatus orderStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CustomerDeviceId")
    private CustomerDevice customerDevice;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;
}
