package org.nulp.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "Role", schema = "dbo")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RolePK", nullable = false)
    private Integer id;

    @Size(max = 30)
    @Column(name = "RoleName", length = 30)
    private String roleName;

}