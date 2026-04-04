package org.nulp.backend.entity;

import jakarta.persistence.*;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "Customer", schema = "dbo")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CustomerPK", nullable = false)
    private Integer id;

    @Size(max = 70)
    @Nationalized
    @Column(name = "FullName", length = 70)
    private String fullName;

    @Size(max = 15)
    @Column(name = "PhoneNumber", length = 15)
    private String phoneNumber;

    @Size(max = 70)
    @Column(name = "Email", length = 70)
    private String email;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}