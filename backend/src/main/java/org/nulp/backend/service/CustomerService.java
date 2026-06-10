package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateCustomerRequest;
import org.nulp.backend.dto.request.UpdateCustomerRequest;
import org.nulp.backend.dto.response.CustomerResponse;
import org.nulp.backend.entity.Customer;
import org.nulp.backend.exception.ConflictException;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.CustomerDeviceRepository;
import org.nulp.backend.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerDeviceRepository customerDeviceRepository;

    public List<CustomerResponse> search(String query) {
        return customerRepository.search(query).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CustomerResponse create(CreateCustomerRequest request) {
        Customer customer = new Customer();
        customer.setFullName(request.fullName());
        customer.setPhoneNumber(request.phoneNumber());
        customer.setEmail(request.email());

        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse update(Integer id, UpdateCustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));

        customer.setFullName(request.fullName());
        customer.setPhoneNumber(request.phoneNumber());
        customer.setEmail(request.email());

        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public void delete(Integer id) {
        if (!customerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Customer not found: " + id);
        }
        if (customerDeviceRepository.existsByCustomerId(id)) {
            throw new ConflictException("Cannot delete customer: has linked devices");
        }
        customerRepository.deleteById(id);
    }

    private CustomerResponse toResponse(Customer c) {
        return new CustomerResponse(c.getId(), c.getFullName(), c.getPhoneNumber(), c.getEmail());
    }
}
