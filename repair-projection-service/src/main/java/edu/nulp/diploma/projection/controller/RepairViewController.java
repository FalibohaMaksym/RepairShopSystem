package edu.nulp.diploma.projection.controller;

import edu.nulp.diploma.projection.repository.InMemoryRepairViewRepository;
import edu.nulp.diploma.projection.repository.RepairViewRepository;
import edu.nulp.diploma.projection.view.RepairView;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RepairViewController {

    private final RepairViewRepository repairViewRepository;

    public RepairViewController(InMemoryRepairViewRepository inMemoryRepairViewRepository) {
        this.repairViewRepository = inMemoryRepairViewRepository;
    }

    @GetMapping("/repairs")
    public ResponseEntity<List<RepairView>> getAll() {
        return new ResponseEntity<>(repairViewRepository.findAll(), HttpStatus.OK);
    }

    @GetMapping("/repairs/{id}")
    public ResponseEntity<RepairView> getById(@PathVariable Long id) {
        return new ResponseEntity<>(repairViewRepository.findById(id).orElseThrow(), HttpStatus.OK);
    }

}
