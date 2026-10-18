package edu.nulp.diploma.repair.controller;

import edu.nulp.diploma.repair.domain.RepairOrderStatus;
import edu.nulp.diploma.repair.dto.request.CreateRepairRequest;
import edu.nulp.diploma.repair.dto.response.CreateRepairResponse;
import edu.nulp.diploma.repair.service.RepairCommandService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/repairs")
public class RepairCommandController {

    private final RepairCommandService repairCommandService;

    public RepairCommandController(RepairCommandService repairCommandService) {
        this.repairCommandService = repairCommandService;
    }

    @PostMapping
    public ResponseEntity<CreateRepairResponse> create(@RequestBody CreateRepairRequest request) {
        Long id = repairCommandService.create(request.getDeviceSerialNumber(), request.getProblem());
        return new ResponseEntity<>(
                new CreateRepairResponse(id, request.getDeviceSerialNumber(), request.getProblem()),
                HttpStatus.CREATED
        );
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> changeStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        repairCommandService.changeStatus(id, RepairOrderStatus.valueOf(status.toUpperCase()));
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id, @RequestParam Double price) {
        repairCommandService.complete(id, BigDecimal.valueOf(price));
        return new ResponseEntity<>(HttpStatus.OK);
    }

}
