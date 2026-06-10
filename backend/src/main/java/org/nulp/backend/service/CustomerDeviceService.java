package org.nulp.backend.service;

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
import org.nulp.backend.entity.*;
import org.nulp.backend.exception.ConflictException;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.JpaOrderRepository;
import org.nulp.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerDeviceService {

    private final CustomerDeviceRepository customerDeviceRepository;
    private final CustomerRepository customerRepository;
    private final DeviceRepository deviceRepository;
    private final JpaOrderRepository jpaOrderRepository;
    private final DeviceTypeRepository deviceTypeRepository;
    private final ProducerRepository producerRepository;
    private final DevicePurposeRepository devicePurposeRepository;

    public List<CustomerDeviceResponse> getByCustomerId(Integer customerId) {
        return customerDeviceRepository.findByCustomerId(customerId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CustomerDeviceResponse create(CreateCustomerDeviceRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + request.customerId()));

        Device device = deviceRepository.findById(request.deviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Device not found: " + request.deviceId()));

        CustomerDevice cd = new CustomerDevice();
        cd.setDeviceSerialNumber(request.deviceSerialNumber());
        cd.setExternalConditionDescription(request.externalConditionDescription());
        cd.setDeviceUsageTime(request.deviceUsageTime());
        cd.setDeviceAdditionalInfo(request.deviceAdditionalInfo());
        cd.setDevice(device);
        cd.setCustomer(customer);

        return toResponse(customerDeviceRepository.save(cd));
    }

    @Transactional
    public CustomerDeviceResponse update(Integer id, UpdateCustomerDeviceRequest request) {
        CustomerDevice cd = customerDeviceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("CustomerDevice not found: " + id));

        Device device = deviceRepository.findById(request.deviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Device not found: " + request.deviceId()));

        cd.setDeviceSerialNumber(request.deviceSerialNumber());
        cd.setExternalConditionDescription(request.externalConditionDescription());
        cd.setDeviceUsageTime(request.deviceUsageTime());
        cd.setDeviceAdditionalInfo(request.deviceAdditionalInfo());
        cd.setDevice(device);

        return toResponse(customerDeviceRepository.save(cd));
    }

    @Transactional
    public DeviceResponse updateDevice(Integer id, UpdateDeviceRequest request) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Device not found: " + id));

        DeviceType deviceType = deviceTypeRepository.findById(request.deviceTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("DeviceType not found: " + request.deviceTypeId()));

        Producer producer = producerRepository.findById(request.producerId())
                .orElseThrow(() -> new ResourceNotFoundException("Producer not found: " + request.producerId()));

        DevicePurpose devicePurpose = null;
        if (request.devicePurposeId() != null) {
            devicePurpose = devicePurposeRepository.findById(request.devicePurposeId())
                    .orElseThrow(() -> new ResourceNotFoundException("DevicePurpose not found: " + request.devicePurposeId()));
        }

        device.setDeviceModel(request.deviceModel());
        device.setDeviceType(deviceType);
        device.setProducer(producer);
        device.setDevicePurpose(devicePurpose);

        return toDeviceResponse(deviceRepository.save(device));
    }

    @Transactional
    public void deleteCustomerDevice(Integer id) {
        if (!customerDeviceRepository.existsById(id)) {
            throw new ResourceNotFoundException("CustomerDevice not found: " + id);
        }
        if (jpaOrderRepository.existsByCustomerDeviceId(id)) {
            throw new ConflictException("Cannot delete customer device: has linked orders");
        }
        customerDeviceRepository.deleteById(id);
    }

    @Transactional
    public void deleteDevice(Integer id) {
        if (!deviceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Device not found: " + id);
        }
        if (customerDeviceRepository.existsByDeviceId(id)) {
            throw new ConflictException("Cannot delete device: has linked customer devices");
        }
        deviceRepository.deleteById(id);
    }

    public List<DeviceTypeResponse> getAllDeviceTypes() {
        return deviceTypeRepository.findAll().stream()
                .map(dt -> new DeviceTypeResponse(dt.getId(), dt.getDeviceTypeName()))
                .toList();
    }

    public List<ProducerResponse> getAllProducers() {
        return producerRepository.findAll().stream()
                .map(p -> new ProducerResponse(p.getId(), p.getProducerCompanyName()))
                .toList();
    }

    public List<DevicePurposeResponse> getAllDevicePurposes() {
        return devicePurposeRepository.findAll().stream()
                .map(dp -> new DevicePurposeResponse(dp.getId(), dp.getDevicePurpose()))
                .toList();
    }

    @Transactional
    public DeviceTypeResponse createDeviceType(CreateDeviceTypeRequest request) {
        DeviceType dt = new DeviceType();
        dt.setDeviceTypeName(request.name());
        DeviceType saved = deviceTypeRepository.save(dt);
        return new DeviceTypeResponse(saved.getId(), saved.getDeviceTypeName());
    }

    @Transactional
    public ProducerResponse createProducer(CreateProducerRequest request) {
        Producer p = new Producer();
        p.setProducerCompanyName(request.name());
        Producer saved = producerRepository.save(p);
        return new ProducerResponse(saved.getId(), saved.getProducerCompanyName());
    }

    @Transactional
    public DevicePurposeResponse createDevicePurpose(CreateDevicePurposeRequest request) {
        DevicePurpose dp = new DevicePurpose();
        dp.setDevicePurpose(request.name());
        DevicePurpose saved = devicePurposeRepository.save(dp);
        return new DevicePurposeResponse(saved.getId(), saved.getDevicePurpose());
    }

    public List<DeviceResponse> searchDevices(String query) {
        return deviceRepository.search(query).stream()
                .map(this::toDeviceResponse)
                .toList();
    }

    @Transactional
    public DeviceResponse createDevice(CreateDeviceRequest request) {
        DeviceType deviceType = deviceTypeRepository.findById(request.deviceTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("DeviceType not found: " + request.deviceTypeId()));

        Producer producer = producerRepository.findById(request.producerId())
                .orElseThrow(() -> new ResourceNotFoundException("Producer not found: " + request.producerId()));

        DevicePurpose devicePurpose = null;
        if (request.devicePurposeId() != null) {
            devicePurpose = devicePurposeRepository.findById(request.devicePurposeId())
                    .orElseThrow(() -> new ResourceNotFoundException("DevicePurpose not found: " + request.devicePurposeId()));
        }

        Device device = new Device();
        device.setDeviceModel(request.deviceModel());
        device.setDeviceType(deviceType);
        device.setProducer(producer);
        device.setDevicePurpose(devicePurpose);

        return toDeviceResponse(deviceRepository.save(device));
    }

    private CustomerDeviceResponse toResponse(CustomerDevice cd) {
        return new CustomerDeviceResponse(
                cd.getId(),
                cd.getDeviceSerialNumber(),
                cd.getExternalConditionDescription(),
                cd.getDeviceUsageTime(),
                cd.getDeviceAdditionalInfo(),
                cd.getDevice().getId(),
                cd.getDevice().getDeviceModel(),
                cd.getDevice().getProducer() != null ? cd.getDevice().getProducer().getProducerCompanyName() : null,
                cd.getDevice().getDeviceType() != null ? cd.getDevice().getDeviceType().getDeviceTypeName() : null,
                cd.getCustomer().getId(),
                cd.getCustomer().getFullName()
        );
    }

    private DeviceResponse toDeviceResponse(Device device) {
        return new DeviceResponse(
                device.getId(),
                device.getDeviceModel(),
                device.getDeviceType() != null ? device.getDeviceType().getDeviceTypeName() : null,
                device.getProducer() != null ? device.getProducer().getProducerCompanyName() : null,
                device.getDevicePurpose() != null ? device.getDevicePurpose().getDevicePurpose() : null
        );
    }
}
