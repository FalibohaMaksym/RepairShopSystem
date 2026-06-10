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
@Table(name = "Branch", schema = "dbo")
public class Branch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BranchPK", nullable = false)
    private Integer id;

    @Size(max = 100)
    @Nationalized
    @Column(name = "BranchAddress", length = 100)
    private String branchAddress;

    @Size(max = 15)
    @Column(name = "BranchPhoneNumber", length = 15)
    private String branchPhoneNumber;

    @Size(max = 70)
    @Column(name = "BranchEmail", length = 70)
    private String branchEmail;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}