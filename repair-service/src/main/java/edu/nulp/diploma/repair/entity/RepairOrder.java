package edu.nulp.diploma.repair.entity;

import edu.nulp.diploma.repair.domain.RepairOrderStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
public class RepairOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String number;

    @Column(precision = 11, scale = 2)
    private BigDecimal price;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_device_id", nullable = false)
    private CustomerDevice customerDevice;

    private String problem;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private RepairOrderStatus status;

}
