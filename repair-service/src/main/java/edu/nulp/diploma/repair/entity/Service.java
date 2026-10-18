package edu.nulp.diploma.repair.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "service")
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String serviceName;

    @Column(precision = 10, scale = 2)
    private BigDecimal servicePrice;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "device_type_id", nullable = false)
    private DeviceType deviceType;

}
