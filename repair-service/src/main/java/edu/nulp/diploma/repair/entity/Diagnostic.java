package edu.nulp.diploma.repair.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class Diagnostic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "repair_order_id", unique = true, nullable = false)
    private RepairOrder repairOrder;

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    private String reason;
    private String solution;
}
