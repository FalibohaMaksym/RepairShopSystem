package org.nulp.backend.repository;

import org.nulp.backend.entity.DeviceType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceTypeRepository extends JpaRepository<DeviceType, Short> {
}
