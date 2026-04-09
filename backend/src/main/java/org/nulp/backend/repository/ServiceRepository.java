package org.nulp.backend.repository;

import org.nulp.backend.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Integer> {

    @Query("""
            SELECT s FROM Service s
            LEFT JOIN FETCH s.serviceCategory
            LEFT JOIN FETCH s.serviceComplexity
            LEFT JOIN FETCH s.deviceType
            ORDER BY s.serviceName ASC
            """)
    List<Service> findAllWithDetails();

    @Query("""
            SELECT s FROM Service s
            LEFT JOIN FETCH s.serviceCategory
            LEFT JOIN FETCH s.serviceComplexity
            LEFT JOIN FETCH s.deviceType
            WHERE LOWER(s.serviceName) LIKE LOWER(CONCAT('%', :query, '%'))
            ORDER BY s.serviceName ASC
            """)
    List<Service> searchByName(@Param("query") String query);

    @Query("""
            SELECT s FROM Service s
            LEFT JOIN FETCH s.serviceCategory
            LEFT JOIN FETCH s.serviceComplexity
            LEFT JOIN FETCH s.deviceType dt
            WHERE dt.id = (
                SELECT d.deviceType.id FROM Order o
                JOIN o.customerDevice cd
                JOIN cd.device d
                WHERE o.orderNumber = :orderNumber
            )
            ORDER BY s.serviceName ASC
            """)
    List<Service> findAllByOrderNumberDeviceType(@Param("orderNumber") String orderNumber);
}
