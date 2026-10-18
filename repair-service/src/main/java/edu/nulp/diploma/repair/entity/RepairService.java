package edu.nulp.diploma.repair.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class RepairService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "repair_order_id", nullable = false)
    private RepairOrder repairOrder;

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
