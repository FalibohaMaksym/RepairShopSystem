package org.nulp.backend.repository;

import org.nulp.backend.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, Integer> {

    @Query("""
            SELECT d FROM Device d
            JOIN FETCH d.deviceType
            JOIN FETCH d.producer
            LEFT JOIN FETCH d.devicePurpose
            WHERE d.deviceModel        LIKE %:query%
               OR d.deviceType.deviceTypeName LIKE %:query%
               OR d.producer.producerCompanyName LIKE %:query%
            """)
    List<Device> search(@Param("query") String query);
}
