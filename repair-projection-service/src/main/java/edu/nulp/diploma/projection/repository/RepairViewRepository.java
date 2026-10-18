package edu.nulp.diploma.projection.repository;

import edu.nulp.diploma.projection.view.RepairView;
import java.util.List;
import java.util.Optional;

public interface RepairViewRepository {
    void save(RepairView view);
    Optional<RepairView> findById(Long id);
    List<RepairView> findAll();
}

