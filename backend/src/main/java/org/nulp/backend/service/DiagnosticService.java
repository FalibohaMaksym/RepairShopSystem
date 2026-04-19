package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CompleteDiagnosticRequest;
import org.nulp.backend.dto.request.SaveDiagnosticDraftRequest;
import org.nulp.backend.dto.response.DiagnosticResponse;
import org.nulp.backend.entity.DefectInDiagonstic;
import org.nulp.backend.entity.DefectInDiagonsticId;
import org.nulp.backend.entity.DeviceDefect;
import org.nulp.backend.entity.Diagnostic;
import org.nulp.backend.entity.Order;
import org.nulp.backend.entity.Worker;
import org.nulp.backend.exception.ConflictException;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.DefectInDiagnosticRepository;
import org.nulp.backend.repository.DeviceDefectRepository;
import org.nulp.backend.repository.DiagnosticRepository;
import org.nulp.backend.repository.JpaOrderRepository;
import org.nulp.backend.repository.WorkerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiagnosticService {

    private final DiagnosticRepository diagnosticRepository;
    private final DefectInDiagnosticRepository defectInDiagnosticRepository;
    private final DeviceDefectRepository deviceDefectRepository;
    private final JpaOrderRepository jpaOrderRepository;
    private final WorkerRepository workerRepository;

    @Transactional
    public DiagnosticResponse create(String orderNumber, Integer workerId) {
        if (diagnosticRepository.existsByOrderOrderNumber(orderNumber)) {
            throw new ConflictException("Diagnostic already exists for order: " + orderNumber);
        }

        Order order = jpaOrderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        Diagnostic diagnostic = new Diagnostic();
        diagnostic.setOrder(order);
        diagnostic.setWorker(worker);
        diagnostic.setDiagnosticStartedAt(LocalDateTime.now());

        Diagnostic saved = diagnosticRepository.save(diagnostic);

        return new DiagnosticResponse(
                saved.getId(),
                saved.getDefectReason(),
                saved.getDefectSolution(),
                saved.getDiagnosticStartedAt(),
                saved.getDiagnosticFinishedAt(),
                worker.getId(),
                worker.getWorkerFullName(),
                List.of()
        );
    }

    @Transactional
    public DiagnosticResponse saveDraft(String orderNumber, SaveDiagnosticDraftRequest request) {
        Diagnostic diagnostic = diagnosticRepository.findByOrderNumberWithWorker(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Diagnostic not found for order: " + orderNumber));

        if (diagnostic.getDiagnosticFinishedAt() != null) {
            throw new ConflictException("Diagnostic for order " + orderNumber + " is already completed");
        }

        diagnostic.setDefectReason(request.defectReason());
        diagnostic.setDefectSolution(request.defectSolution());
        diagnosticRepository.save(diagnostic);

        return updateDefectsAndMap(diagnostic, request.defectIds());
    }

    @Transactional
    public DiagnosticResponse complete(String orderNumber, CompleteDiagnosticRequest request) {
        Diagnostic diagnostic = diagnosticRepository.findByOrderNumberWithWorker(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Diagnostic not found for order: " + orderNumber));

        if (diagnostic.getDiagnosticFinishedAt() != null) {
            throw new ConflictException("Diagnostic for order " + orderNumber + " is already completed");
        }

        diagnostic.setDefectReason(request.defectReason());
        diagnostic.setDefectSolution(request.defectSolution());
        diagnostic.setDiagnosticFinishedAt(LocalDateTime.now());
        diagnosticRepository.save(diagnostic);

        return updateDefectsAndMap(diagnostic, request.defectIds());
    }

    private DiagnosticResponse updateDefectsAndMap(Diagnostic diagnostic, List<Short> defectIds) {
        defectInDiagnosticRepository.deleteByDiagnosticId(diagnostic.getId());

        List<DiagnosticResponse.DefectResponse> defectResponses = List.of();
        if (defectIds != null && !defectIds.isEmpty()) {
            List<DefectInDiagonstic> newDefects = defectIds.stream()
                    .map(defectId -> {
                        DefectInDiagonsticId embId = new DefectInDiagonsticId();
                        embId.setDiagnosticId(diagnostic.getId());
                        embId.setDeviceDefectId(defectId);
                        DefectInDiagonstic did = new DefectInDiagonstic();
                        did.setId(embId);
                        did.setDiagnostic(diagnostic);
                        did.setDeviceDefect(deviceDefectRepository.getReferenceById(defectId));
                        return did;
                    })
                    .toList();
            defectInDiagnosticRepository.saveAll(newDefects);

            defectResponses = defectInDiagnosticRepository
                    .findByDiagnosticIdWithDefect(diagnostic.getId()).stream()
                    .map(did -> new DiagnosticResponse.DefectResponse(
                            did.getDeviceDefect().getId(),
                            did.getDeviceDefect().getDeviceDefectName()))
                    .toList();
        }

        Worker w = diagnostic.getWorker();
        return new DiagnosticResponse(
                diagnostic.getId(),
                diagnostic.getDefectReason(),
                diagnostic.getDefectSolution(),
                diagnostic.getDiagnosticStartedAt(),
                diagnostic.getDiagnosticFinishedAt(),
                w != null ? w.getId() : null,
                w != null ? w.getWorkerFullName() : null,
                defectResponses
        );
    }

    @Transactional(readOnly = true)
    public DiagnosticResponse getByOrderNumber(String orderNumber) {
        Diagnostic d = diagnosticRepository.findByOrderNumberWithWorker(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Diagnostic not found for order: " + orderNumber));

        List<DiagnosticResponse.DefectResponse> defects =
                defectInDiagnosticRepository.findByDiagnosticIdWithDefect(d.getId()).stream()
                        .map(did -> new DiagnosticResponse.DefectResponse(
                                did.getDeviceDefect().getId(),
                                did.getDeviceDefect().getDeviceDefectName()
                        ))
                        .toList();

        Worker w = d.getWorker();
        return new DiagnosticResponse(
                d.getId(),
                d.getDefectReason(),
                d.getDefectSolution(),
                d.getDiagnosticStartedAt(),
                d.getDiagnosticFinishedAt(),
                w != null ? w.getId() : null,
                w != null ? w.getWorkerFullName() : null,
                defects
        );
    }
}
