package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.ReferenceItemRequest;
import org.nulp.backend.dto.response.ReferenceItemResponse;
import org.nulp.backend.entity.ComponentCategory;
import org.nulp.backend.entity.DevicePurpose;
import org.nulp.backend.entity.DeviceType;
import org.nulp.backend.entity.Position;
import org.nulp.backend.entity.Producer;
import org.nulp.backend.entity.ServiceCategory;
import org.nulp.backend.entity.ServiceComplexity;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.ComponentCategoryRepository;
import org.nulp.backend.repository.DevicePurposeRepository;
import org.nulp.backend.repository.DeviceTypeRepository;
import org.nulp.backend.repository.PositionRepository;
import org.nulp.backend.repository.ProducerRepository;
import org.nulp.backend.repository.ServiceCategoryRepository;
import org.nulp.backend.repository.ServiceComplexityRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

/**
 * CRUD для всіх простих довідників (Reference Data).
 * Path variable завжди Integer — конвертація в Short відбувається перед зверненням
 * до репозиторіїв з tinyint PK, щоб уникнути помилки типізації Spring MVC.
 * Доступ: тільки Системний адміністратор.
 */
@RestController
@RequestMapping("/api/data-management")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_Системний адміністратор')")
public class DataManagementController {

    private final DeviceTypeRepository deviceTypeRepository;
    private final DevicePurposeRepository devicePurposeRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final ServiceComplexityRepository serviceComplexityRepository;
    private final ComponentCategoryRepository componentCategoryRepository;
    private final ProducerRepository producerRepository;
    private final PositionRepository positionRepository;

    // ── DeviceType (Short PK) ─────────────────────────────────────────────────

    @GetMapping("/device-types")
    public ResponseEntity<List<ReferenceItemResponse>> getDeviceTypes() {
        return ResponseEntity.ok(deviceTypeRepository.findAll().stream()
                .map(e -> new ReferenceItemResponse(e.getId(), e.getDeviceTypeName()))
                .toList());
    }

    @PostMapping("/device-types")
    public ResponseEntity<ReferenceItemResponse> createDeviceType(@Valid @RequestBody ReferenceItemRequest req) {
        DeviceType e = new DeviceType();
        e.setDeviceTypeName(req.name());
        e.setCreateDatetime(LocalDateTime.now());
        DeviceType saved = deviceTypeRepository.save(e);
        return ResponseEntity.status(201).body(new ReferenceItemResponse(saved.getId(), saved.getDeviceTypeName()));
    }

    @PutMapping("/device-types/{id}")
    public ResponseEntity<ReferenceItemResponse> updateDeviceType(@PathVariable Integer id,
                                                                   @Valid @RequestBody ReferenceItemRequest req) {
        DeviceType e = deviceTypeRepository.findById(id.shortValue())
                .orElseThrow(() -> new ResourceNotFoundException("DeviceType not found: " + id));
        e.setDeviceTypeName(req.name());
        e.setUpdateDatetime(LocalDateTime.now());
        DeviceType saved = deviceTypeRepository.save(e);
        return ResponseEntity.ok(new ReferenceItemResponse(saved.getId(), saved.getDeviceTypeName()));
    }

    @DeleteMapping("/device-types/{id}")
    public ResponseEntity<Void> deleteDeviceType(@PathVariable Integer id) {
        if (!deviceTypeRepository.existsById(id.shortValue()))
            throw new ResourceNotFoundException("DeviceType not found: " + id);
        deviceTypeRepository.deleteById(id.shortValue());
        return ResponseEntity.noContent().build();
    }

    // ── DevicePurpose (Short PK) ──────────────────────────────────────────────

    @GetMapping("/device-purposes")
    public ResponseEntity<List<ReferenceItemResponse>> getDevicePurposes() {
        return ResponseEntity.ok(devicePurposeRepository.findAll().stream()
                .map(e -> new ReferenceItemResponse(e.getId(), e.getDevicePurpose()))
                .toList());
    }

    @PostMapping("/device-purposes")
    public ResponseEntity<ReferenceItemResponse> createDevicePurpose(@Valid @RequestBody ReferenceItemRequest req) {
        DevicePurpose e = new DevicePurpose();
        e.setDevicePurpose(req.name());
        e.setCreateDatetime(LocalDateTime.now());
        DevicePurpose saved = devicePurposeRepository.save(e);
        return ResponseEntity.status(201).body(new ReferenceItemResponse(saved.getId(), saved.getDevicePurpose()));
    }

    @PutMapping("/device-purposes/{id}")
    public ResponseEntity<ReferenceItemResponse> updateDevicePurpose(@PathVariable Integer id,
                                                                      @Valid @RequestBody ReferenceItemRequest req) {
        DevicePurpose e = devicePurposeRepository.findById(id.shortValue())
                .orElseThrow(() -> new ResourceNotFoundException("DevicePurpose not found: " + id));
        e.setDevicePurpose(req.name());
        e.setUpdateDatetime(LocalDateTime.now());
        DevicePurpose saved = devicePurposeRepository.save(e);
        return ResponseEntity.ok(new ReferenceItemResponse(saved.getId(), saved.getDevicePurpose()));
    }

    @DeleteMapping("/device-purposes/{id}")
    public ResponseEntity<Void> deleteDevicePurpose(@PathVariable Integer id) {
        if (!devicePurposeRepository.existsById(id.shortValue()))
            throw new ResourceNotFoundException("DevicePurpose not found: " + id);
        devicePurposeRepository.deleteById(id.shortValue());
        return ResponseEntity.noContent().build();
    }

    // ── ServiceCategory (Short PK) ────────────────────────────────────────────

    @GetMapping("/service-categories")
    public ResponseEntity<List<ReferenceItemResponse>> getServiceCategories() {
        return ResponseEntity.ok(serviceCategoryRepository.findAll().stream()
                .map(e -> new ReferenceItemResponse(e.getId(), e.getServiceCategoryName()))
                .toList());
    }

    @PostMapping("/service-categories")
    public ResponseEntity<ReferenceItemResponse> createServiceCategory(@Valid @RequestBody ReferenceItemRequest req) {
        ServiceCategory e = new ServiceCategory();
        e.setServiceCategoryName(req.name());
        e.setCreateDatetime(LocalDateTime.now());
        ServiceCategory saved = serviceCategoryRepository.save(e);
        return ResponseEntity.status(201).body(new ReferenceItemResponse(saved.getId(), saved.getServiceCategoryName()));
    }

    @PutMapping("/service-categories/{id}")
    public ResponseEntity<ReferenceItemResponse> updateServiceCategory(@PathVariable Integer id,
                                                                        @Valid @RequestBody ReferenceItemRequest req) {
        ServiceCategory e = serviceCategoryRepository.findById(id.shortValue())
                .orElseThrow(() -> new ResourceNotFoundException("ServiceCategory not found: " + id));
        e.setServiceCategoryName(req.name());
        e.setUpdateDatetime(LocalDateTime.now());
        ServiceCategory saved = serviceCategoryRepository.save(e);
        return ResponseEntity.ok(new ReferenceItemResponse(saved.getId(), saved.getServiceCategoryName()));
    }

    @DeleteMapping("/service-categories/{id}")
    public ResponseEntity<Void> deleteServiceCategory(@PathVariable Integer id) {
        if (!serviceCategoryRepository.existsById(id.shortValue()))
            throw new ResourceNotFoundException("ServiceCategory not found: " + id);
        serviceCategoryRepository.deleteById(id.shortValue());
        return ResponseEntity.noContent().build();
    }

    // ── ServiceComplexity (Short PK) ──────────────────────────────────────────

    @GetMapping("/service-complexities")
    public ResponseEntity<List<ReferenceItemResponse>> getServiceComplexities() {
        return ResponseEntity.ok(serviceComplexityRepository.findAll().stream()
                .map(e -> new ReferenceItemResponse(e.getId(), e.getServiceComplexityValue()))
                .toList());
    }

    @PostMapping("/service-complexities")
    public ResponseEntity<ReferenceItemResponse> createServiceComplexity(@Valid @RequestBody ReferenceItemRequest req) {
        ServiceComplexity e = new ServiceComplexity();
        e.setServiceComplexityValue(req.name());
        e.setCreateDatetime(LocalDateTime.now());
        ServiceComplexity saved = serviceComplexityRepository.save(e);
        return ResponseEntity.status(201).body(new ReferenceItemResponse(saved.getId(), saved.getServiceComplexityValue()));
    }

    @PutMapping("/service-complexities/{id}")
    public ResponseEntity<ReferenceItemResponse> updateServiceComplexity(@PathVariable Integer id,
                                                                          @Valid @RequestBody ReferenceItemRequest req) {
        ServiceComplexity e = serviceComplexityRepository.findById(id.shortValue())
                .orElseThrow(() -> new ResourceNotFoundException("ServiceComplexity not found: " + id));
        e.setServiceComplexityValue(req.name());
        e.setUpdateDatetime(LocalDateTime.now());
        ServiceComplexity saved = serviceComplexityRepository.save(e);
        return ResponseEntity.ok(new ReferenceItemResponse(saved.getId(), saved.getServiceComplexityValue()));
    }

    @DeleteMapping("/service-complexities/{id}")
    public ResponseEntity<Void> deleteServiceComplexity(@PathVariable Integer id) {
        if (!serviceComplexityRepository.existsById(id.shortValue()))
            throw new ResourceNotFoundException("ServiceComplexity not found: " + id);
        serviceComplexityRepository.deleteById(id.shortValue());
        return ResponseEntity.noContent().build();
    }

    // ── ComponentCategory (Short PK) ──────────────────────────────────────────

    @GetMapping("/component-categories")
    public ResponseEntity<List<ReferenceItemResponse>> getComponentCategories() {
        return ResponseEntity.ok(componentCategoryRepository.findAll().stream()
                .map(e -> new ReferenceItemResponse(e.getId(), e.getComponentCategoryName()))
                .toList());
    }

    @PostMapping("/component-categories")
    public ResponseEntity<ReferenceItemResponse> createComponentCategory(@Valid @RequestBody ReferenceItemRequest req) {
        ComponentCategory e = new ComponentCategory();
        e.setComponentCategoryName(req.name());
        e.setCreateDatetime(LocalDateTime.now());
        ComponentCategory saved = componentCategoryRepository.save(e);
        return ResponseEntity.status(201).body(new ReferenceItemResponse(saved.getId(), saved.getComponentCategoryName()));
    }

    @PutMapping("/component-categories/{id}")
    public ResponseEntity<ReferenceItemResponse> updateComponentCategory(@PathVariable Integer id,
                                                                          @Valid @RequestBody ReferenceItemRequest req) {
        ComponentCategory e = componentCategoryRepository.findById(id.shortValue())
                .orElseThrow(() -> new ResourceNotFoundException("ComponentCategory not found: " + id));
        e.setComponentCategoryName(req.name());
        e.setUpdateDatetime(LocalDateTime.now());
        ComponentCategory saved = componentCategoryRepository.save(e);
        return ResponseEntity.ok(new ReferenceItemResponse(saved.getId(), saved.getComponentCategoryName()));
    }

    @DeleteMapping("/component-categories/{id}")
    public ResponseEntity<Void> deleteComponentCategory(@PathVariable Integer id) {
        if (!componentCategoryRepository.existsById(id.shortValue()))
            throw new ResourceNotFoundException("ComponentCategory not found: " + id);
        componentCategoryRepository.deleteById(id.shortValue());
        return ResponseEntity.noContent().build();
    }

    // ── Producer (Integer PK) ─────────────────────────────────────────────────

    @GetMapping("/producers")
    public ResponseEntity<List<ReferenceItemResponse>> getProducers() {
        return ResponseEntity.ok(producerRepository.findAll().stream()
                .map(e -> new ReferenceItemResponse(e.getId(), e.getProducerCompanyName()))
                .toList());
    }

    @PostMapping("/producers")
    public ResponseEntity<ReferenceItemResponse> createProducer(@Valid @RequestBody ReferenceItemRequest req) {
        Producer e = new Producer();
        e.setProducerCompanyName(req.name());
        e.setCreateDatetime(LocalDateTime.now());
        Producer saved = producerRepository.save(e);
        return ResponseEntity.status(201).body(new ReferenceItemResponse(saved.getId(), saved.getProducerCompanyName()));
    }

    @PutMapping("/producers/{id}")
    public ResponseEntity<ReferenceItemResponse> updateProducer(@PathVariable Integer id,
                                                                 @Valid @RequestBody ReferenceItemRequest req) {
        Producer e = producerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producer not found: " + id));
        e.setProducerCompanyName(req.name());
        e.setUpdateDatetime(LocalDateTime.now());
        Producer saved = producerRepository.save(e);
        return ResponseEntity.ok(new ReferenceItemResponse(saved.getId(), saved.getProducerCompanyName()));
    }

    @DeleteMapping("/producers/{id}")
    public ResponseEntity<Void> deleteProducer(@PathVariable Integer id) {
        if (!producerRepository.existsById(id))
            throw new ResourceNotFoundException("Producer not found: " + id);
        producerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Position (Short PK) ───────────────────────────────────────────────────

    @GetMapping("/positions")
    public ResponseEntity<List<ReferenceItemResponse>> getPositions() {
        return ResponseEntity.ok(positionRepository.findAll().stream()
                .map(e -> new ReferenceItemResponse(e.getId(), e.getPositionName()))
                .toList());
    }

    @PostMapping("/positions")
    public ResponseEntity<ReferenceItemResponse> createPosition(@Valid @RequestBody ReferenceItemRequest req) {
        Position e = new Position();
        e.setPositionName(req.name());
        e.setCreateDatetime(LocalDateTime.now());
        Position saved = positionRepository.save(e);
        return ResponseEntity.status(201).body(new ReferenceItemResponse(saved.getId(), saved.getPositionName()));
    }

    @PutMapping("/positions/{id}")
    public ResponseEntity<ReferenceItemResponse> updatePosition(@PathVariable Integer id,
                                                                 @Valid @RequestBody ReferenceItemRequest req) {
        Position e = positionRepository.findById(id.shortValue())
                .orElseThrow(() -> new ResourceNotFoundException("Position not found: " + id));
        e.setPositionName(req.name());
        e.setUpdateDatetime(LocalDateTime.now());
        Position saved = positionRepository.save(e);
        return ResponseEntity.ok(new ReferenceItemResponse(saved.getId(), saved.getPositionName()));
    }

    @DeleteMapping("/positions/{id}")
    public ResponseEntity<Void> deletePosition(@PathVariable Integer id) {
        if (!positionRepository.existsById(id.shortValue()))
            throw new ResourceNotFoundException("Position not found: " + id);
        positionRepository.deleteById(id.shortValue());
        return ResponseEntity.noContent().build();
    }
}
