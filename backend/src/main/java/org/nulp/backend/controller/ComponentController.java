package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateComponentRequest;
import org.nulp.backend.dto.response.ComponentCatalogResponse;
import org.nulp.backend.dto.response.ComponentCategoryResponse;
import org.nulp.backend.dto.response.ComponentPriceRangeResponse;
import org.nulp.backend.dto.response.ProducerResponse;
import org.nulp.backend.dto.response.WarrantyObligationResponse;
import org.nulp.backend.entity.Component;
import org.nulp.backend.entity.ComponentCategory;
import org.nulp.backend.entity.Producer;
import org.nulp.backend.entity.WarrantyObligation;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.ComponentCategoryRepository;
import org.nulp.backend.repository.ComponentRepository;
import org.nulp.backend.repository.ProducerRepository;
import org.nulp.backend.repository.WarrantyObligationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/components")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
public class ComponentController {

    private final ComponentCategoryRepository componentCategoryRepository;
    private final ProducerRepository producerRepository;
    private final ComponentRepository componentRepository;
    private final WarrantyObligationRepository warrantyObligationRepository;

    @GetMapping("/categories")
    public ResponseEntity<List<ComponentCategoryResponse>> getCategories() {
        return ResponseEntity.ok(
                componentCategoryRepository.findAll().stream()
                        .map(c -> new ComponentCategoryResponse(c.getId(), c.getComponentCategoryName()))
                        .toList()
        );
    }

    @GetMapping("/producers")
    public ResponseEntity<List<ProducerResponse>> getProducers() {
        return ResponseEntity.ok(
                producerRepository.findAllWithComponents().stream()
                        .map(p -> new ProducerResponse(p.getId(), p.getProducerCompanyName()))
                        .toList()
        );
    }

    @GetMapping("/warranty-obligations")
    public ResponseEntity<List<WarrantyObligationResponse>> getWarrantyObligations() {
        return ResponseEntity.ok(
                warrantyObligationRepository.findAll().stream()
                        .map(w -> new WarrantyObligationResponse(w.getId(), w.getObligationDescription()))
                        .toList()
        );
    }

    @GetMapping("/price-range")
    public ResponseEntity<ComponentPriceRangeResponse> getPriceRange() {
        Object[] row = componentRepository.findPriceRange().get(0);
        return ResponseEntity.ok(new ComponentPriceRangeResponse(
                (BigDecimal) row[0],
                (BigDecimal) row[1]
        ));
    }

    @GetMapping
    public ResponseEntity<List<ComponentCatalogResponse>> getComponents(
            @RequestParam(required = false) Integer producerId,
            @RequestParam(required = false) Short categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String search) {
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        return ResponseEntity.ok(
                componentRepository.findFiltered(producerId, categoryId, minPrice, maxPrice, searchParam).stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<ComponentCatalogResponse> createComponent(@Valid @RequestBody CreateComponentRequest request) {
        Producer producer = producerRepository.findById(request.producerId())
                .orElseThrow(() -> new ResourceNotFoundException("Producer not found: " + request.producerId()));
        ComponentCategory category = componentCategoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.categoryId()));
        WarrantyObligation warrantyObligation = warrantyObligationRepository.findById(request.warrantyObligationId())
                .orElseThrow(() -> new ResourceNotFoundException("WarrantyObligation not found: " + request.warrantyObligationId()));

        Component component = new Component();
        component.setComponentModel(request.componentModel());
        component.setProducer(producer);
        component.setComponentCategory(category);
        component.setWarrantyObligation(warrantyObligation);
        component.setWarrantyPeriod(request.warrantyPeriod());
        component.setComponentPrice(request.componentPrice());
        component.setCreateDatetime(LocalDateTime.now());

        Component saved = componentRepository.save(component);
        return ResponseEntity.status(201).body(toResponse(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<Void> deleteComponent(@PathVariable Integer id) {
        if (!componentRepository.existsById(id))
            throw new ResourceNotFoundException("Component not found: " + id);
        componentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ComponentCatalogResponse toResponse(Component c) {
        return new ComponentCatalogResponse(
                c.getId(),
                c.getComponentModel(),
                c.getComponentPrice(),
                c.getProducer() != null ? c.getProducer().getId() : null,
                c.getProducer() != null ? c.getProducer().getProducerCompanyName() : null,
                c.getComponentCategory() != null ? c.getComponentCategory().getId() : null,
                c.getComponentCategory() != null ? c.getComponentCategory().getComponentCategoryName() : null,
                c.getWarrantyPeriod()
        );
    }
}
