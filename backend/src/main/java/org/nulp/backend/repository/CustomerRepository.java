package org.nulp.backend.repository;

import org.nulp.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    @Query("""
            SELECT c FROM Customer c
            WHERE c.fullName    LIKE %:query%
               OR c.phoneNumber LIKE %:query%
               OR c.email       LIKE %:query%
            """)
    List<Customer> search(@Param("query") String query);
}
