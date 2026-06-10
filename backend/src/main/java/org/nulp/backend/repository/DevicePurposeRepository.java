package org.nulp.backend.repository;

import org.nulp.backend.entity.DevicePurpose;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DevicePurposeRepository extends JpaRepository<DevicePurpose, Short> {
}
