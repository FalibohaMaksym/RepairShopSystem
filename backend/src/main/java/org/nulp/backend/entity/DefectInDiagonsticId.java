package org.nulp.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.Hibernate;

import java.io.Serializable;
import java.util.Objects;

@Getter
@Setter
@Embeddable
public class DefectInDiagonsticId implements Serializable {
    private static final long serialVersionUID = 2041875629962942795L;
    @NotNull
    @Column(name = "DiagnosticId", nullable = false)
    private Integer diagnosticId;

    @Column(name = "DeviceDefectId", columnDefinition = "tinyint not null")
    private Short deviceDefectId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        DefectInDiagonsticId entity = (DefectInDiagonsticId) o;
        return Objects.equals(this.diagnosticId, entity.diagnosticId) &&
                Objects.equals(this.deviceDefectId, entity.deviceDefectId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(diagnosticId, deviceDefectId);
    }

}