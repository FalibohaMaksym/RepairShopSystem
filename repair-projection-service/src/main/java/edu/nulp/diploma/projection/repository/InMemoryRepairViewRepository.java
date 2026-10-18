package edu.nulp.diploma.projection.repository;

import edu.nulp.diploma.projection.view.RepairView;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryRepairViewRepository implements RepairViewRepository {

    private final Map<Long, RepairView> views = new ConcurrentHashMap<>();

    @Override
    public void save(RepairView view) {
        views.put(view.getId(), view);
    }

    @Override
    public Optional<RepairView> findById(Long id) {
        return Optional.of(views.get(id));
    }

    @Override
    public List<RepairView> findAll() {
        return new ArrayList<>(views.values());
    }
}
