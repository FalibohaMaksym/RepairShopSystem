package org.nulp.backend.repository;

import org.nulp.backend.entity.DeviceDefect;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceDefectRepository extends JpaRepository<DeviceDefect, Short> {
}
