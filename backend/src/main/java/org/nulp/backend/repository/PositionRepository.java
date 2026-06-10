package org.nulp.backend.repository;

import org.nulp.backend.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PositionRepository extends JpaRepository<Position, Short> {
}
