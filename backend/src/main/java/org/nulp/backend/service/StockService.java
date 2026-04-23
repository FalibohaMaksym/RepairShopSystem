package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nulp.backend.dto.request.TransferRequest;
import org.nulp.backend.dto.response.MissingComponentResponse;
import org.nulp.backend.dto.response.StockItemResponse;
import org.nulp.backend.entity.Branch;
import org.nulp.backend.entity.BranchStock;
import org.nulp.backend.entity.Component;
import org.nulp.backend.entity.ComponentCategory;
import org.nulp.backend.entity.Producer;
import org.nulp.backend.exception.ConflictException;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.BranchRepository;
import org.nulp.backend.repository.BranchStockRepository;
import org.nulp.backend.repository.ComponentRepository;
import org.nulp.backend.repository.WorkerRepository;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private final BranchStockRepository branchStockRepository;
    private final BranchRepository branchRepository;
    private final ComponentRepository componentRepository;
    private final WorkerRepository workerRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<StockItemResponse> getStock(Integer branchId) {
        return branchStockRepository.findAllWithDetails(branchId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void transfer(TransferRequest request, Integer workerBranchId) {
        Integer toBranchId = request.toBranchId() != null ? request.toBranchId() : workerBranchId;

        log.info("Transfer request: fromBranchId={}, toBranchId={}, componentId={}, quantity={}",
                request.fromBranchId(), toBranchId, request.componentId(), request.quantity());

        if (request.fromBranchId().equals(toBranchId)) {
            throw new ConflictException("Source and destination branches must be different");
        }

        BranchStock source = branchStockRepository
                .findByBranchIdAndComponentId(request.fromBranchId(), request.componentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Component not found in source branch stock"));

        log.info("Source BranchStock: id={}, currentQuantity={}", source.getId(), source.getCurrentQuantity());

        if (source.getCurrentQuantity() < request.quantity()) {
            throw new ConflictException(
                    "Insufficient stock: available " + source.getCurrentQuantity() +
                    ", requested " + request.quantity());
        }

        BranchStock destination = branchStockRepository
                .findByBranchIdAndComponentId(toBranchId, request.componentId())
                .orElseGet(() -> {
                    log.info("Destination BranchStock not found, creating new for branchId={}", toBranchId);
                    Branch branch = branchRepository.findById(toBranchId)
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Destination branch not found: " + toBranchId));
                    Component component = componentRepository.findById(request.componentId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Component not found: " + request.componentId()));
                    BranchStock newStock = new BranchStock();
                    newStock.setBranch(branch);
                    newStock.setComponent(component);
                    newStock.setCurrentQuantity(0);
                    newStock.setCreateDatetime(LocalDateTime.now());
                    return branchStockRepository.save(newStock);
                });

        log.info("Destination BranchStock: id={}, currentQuantity={}", destination.getId(), destination.getCurrentQuantity());

        int newSourceQty = source.getCurrentQuantity() - request.quantity();
        int newDestQty = destination.getCurrentQuantity() + request.quantity();

        source.setCurrentQuantity(newSourceQty);
        destination.setCurrentQuantity(newDestQty);

        branchStockRepository.save(source);
        branchStockRepository.save(destination);

        log.info("Transfer complete: source id={} qty {} -> {}, destination id={} qty {} -> {}",
                source.getId(), source.getCurrentQuantity() + request.quantity(), newSourceQty,
                destination.getId(), destination.getCurrentQuantity() - request.quantity(), newDestQty);
    }

    public List<MissingComponentResponse> getMissingComponents(Integer workerId, Integer componentId) {
        Integer branchId = workerRepository.findByIdWithBranch(workerId)
                .map(w -> w.getBranch() != null ? w.getBranch().getId() : null)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        if (branchId == null) {
            throw new ResourceNotFoundException("Worker has no branch assigned");
        }

        List<MissingComponentResponse> results = jdbcTemplate.query(
                "EXEC dbo.usp_GetMissingComponentsForPendingServices @BranchID = ?",
                (rs, rowNum) -> new MissingComponentResponse(
                        rs.getInt("ComponentPK"),
                        rs.getString("ComponentModel"),
                        rs.getString("ComponentCategoryName"),
                        rs.getString("ComponentManufacturer"),
                        rs.getInt("RequiredQuantity"),
                        rs.getString("OtherBranchAddress"),
                        rs.getInt("QuantityInOtherBranch")
                ),
                branchId
        );

        if (componentId != null) {
            return results.stream()
                    .filter(r -> componentId.equals(r.componentId()))
                    .toList();
        }

        return results;
    }

    private StockItemResponse toResponse(BranchStock bs) {
        Branch branch = bs.getBranch();
        Component c = bs.getComponent();
        Producer producer = c != null ? c.getProducer() : null;
        ComponentCategory category = c != null ? c.getComponentCategory() : null;

        return new StockItemResponse(
                bs.getId(),
                branch != null ? branch.getId() : null,
                branch != null ? branch.getBranchAddress() : null,
                c != null ? c.getId() : null,
                c != null ? c.getComponentModel() : null,
                producer != null ? producer.getProducerCompanyName() : null,
                category != null ? category.getComponentCategoryName() : null,
                c != null ? c.getComponentPrice() : null,
                bs.getCurrentQuantity()
        );
    }
}
