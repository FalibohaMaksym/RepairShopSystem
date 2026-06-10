package org.nulp.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "Producer", schema = "dbo")
public class Producer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProducerPK", nullable = false)
    private Integer id;

    @Size(max = 30)
    @Nationalized
    @Column(name = "ProducerCompanyName", length = 30)
    private String producerCompanyName;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}