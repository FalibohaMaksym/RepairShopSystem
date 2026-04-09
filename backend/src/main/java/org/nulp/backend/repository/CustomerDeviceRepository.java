package org.nulp.backend.repository;

import org.nulp.backend.entity.CustomerDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerDeviceRepository extends JpaRepository<CustomerDevice, Integer> {

    @Query("""
            SELECT cd FROM CustomerDevice cd
            JOIN FETCH cd.device d
            JOIN FETCH cd.customer c
            JOIN FETCH d.deviceType
            JOIN FETCH d.producer
            WHERE cd.id = :id
            """)
    Optional<CustomerDevice> findByIdWithDetails(@Param("id") Integer id);

    @Query("""
            SELECT cd FROM CustomerDevice cd
            JOIN FETCH cd.device d
            JOIN FETCH cd.customer c
            JOIN FETCH d.deviceType
            JOIN FETCH d.producer
            WHERE c.id = :customerId
            """)
    List<CustomerDevice> findByCustomerId(@Param("customerId") Integer customerId);

    boolean existsByCustomerId(Integer customerId);

    boolean existsByDeviceId(Integer deviceId);
}
