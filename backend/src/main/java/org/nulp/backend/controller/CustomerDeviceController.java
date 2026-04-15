package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateCustomerDeviceRequest;
import org.nulp.backend.dto.request.CreateDevicePurposeRequest;
import org.nulp.backend.dto.request.CreateDeviceRequest;
import org.nulp.backend.dto.request.CreateDeviceTypeRequest;
import org.nulp.backend.dto.request.CreateProducerRequest;
import org.nulp.backend.dto.request.UpdateCustomerDeviceRequest;
import org.nulp.backend.dto.request.UpdateDeviceRequest;
import org.nulp.backend.dto.response.CustomerDeviceResponse;
import org.nulp.backend.dto.response.DevicePurposeResponse;
import org.nulp.backend.dto.response.DeviceResponse;
import org.nulp.backend.dto.response.DeviceTypeResponse;
import org.nulp.backend.dto.response.ProducerResponse;
import org.nulp.backend.service.CustomerDeviceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer-devices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
public class CustomerDeviceController {

    private final CustomerDeviceService customerDeviceService;

    @GetMapping
    public ResponseEntity<List<CustomerDeviceResponse>> getByCustomer(@RequestParam Integer customerId) {
        return ResponseEntity.ok(customerDeviceService.getByCustomerId(customerId));
    }

    @PostMapping
    public ResponseEntity<CustomerDeviceResponse> create(@Valid @RequestBody CreateCustomerDeviceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerDeviceService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerDeviceResponse> update(@PathVariable Integer id,
                                                         @Valid @RequestBody UpdateCustomerDeviceRequest request) {
        return ResponseEntity.ok(customerDeviceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomerDevice(@PathVariable Integer id) {
        customerDeviceService.deleteCustomerDevice(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/devices/types")
    public ResponseEntity<List<DeviceTypeResponse>> getDeviceTypes() {
        return ResponseEntity.ok(customerDeviceService.getAllDeviceTypes());
    }

    @PostMapping("/devices/types")
    public ResponseEntity<DeviceTypeResponse> createDeviceType(@Valid @RequestBody CreateDeviceTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerDeviceService.createDeviceType(request));
    }

    @GetMapping("/devices/producers")
    public ResponseEntity<List<ProducerResponse>> getProducers() {
        return ResponseEntity.ok(customerDeviceService.getAllProducers());
    }

    @PostMapping("/devices/producers")
    public ResponseEntity<ProducerResponse> createProducer(@Valid @RequestBody CreateProducerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerDeviceService.createProducer(request));
    }

    @GetMapping("/devices/purposes")
    public ResponseEntity<List<DevicePurposeResponse>> getDevicePurposes() {
        return ResponseEntity.ok(customerDeviceService.getAllDevicePurposes());
    }

    @PostMapping("/devices/purposes")
    public ResponseEntity<DevicePurposeResponse> createDevicePurpose(@Valid @RequestBody CreateDevicePurposeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerDeviceService.createDevicePurpose(request));
    }

    @GetMapping("/devices/search")
    public ResponseEntity<List<DeviceResponse>> searchDevices(@RequestParam String query) {
        return ResponseEntity.ok(customerDeviceService.searchDevices(query));
    }

    @PostMapping("/devices")
    public ResponseEntity<DeviceResponse> createDevice(@Valid @RequestBody CreateDeviceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerDeviceService.createDevice(request));
    }

    @PutMapping("/devices/{id}")
    public ResponseEntity<DeviceResponse> updateDevice(@PathVariable Integer id,
                                                       @Valid @RequestBody UpdateDeviceRequest request) {
        return ResponseEntity.ok(customerDeviceService.updateDevice(id, request));
    }

    @DeleteMapping("/devices/{id}")
    public ResponseEntity<Void> deleteDevice(@PathVariable Integer id) {
        customerDeviceService.deleteDevice(id);
        return ResponseEntity.noContent().build();
    }
}
