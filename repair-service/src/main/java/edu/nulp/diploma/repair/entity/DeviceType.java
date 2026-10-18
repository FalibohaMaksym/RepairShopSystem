package edu.nulp.diploma.repair.entity;

import jakarta.persistence.*;

@Entity
public class DeviceType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String typeName;

}
