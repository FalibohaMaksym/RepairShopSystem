package org.nulp.backend.repository;

import org.nulp.backend.entity.Component;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ComponentRepository extends JpaRepository<Component, Integer> {

    @Query("SELECT MIN(c.componentPrice), MAX(c.componentPrice) FROM Component c")
    List<Object[]> findPriceRange();

    @Query("""
            SELECT c FROM Component c
            LEFT JOIN FETCH c.producer
            LEFT JOIN FETCH c.componentCategory
            WHERE (:producerId IS NULL OR c.producer.id = :producerId)
              AND (:categoryId IS NULL OR c.componentCategory.id = :categoryId)
              AND (:minPrice IS NULL OR c.componentPrice >= :minPrice)
              AND (:maxPrice IS NULL OR c.componentPrice <= :maxPrice)
              AND (:search IS NULL OR LOWER(c.componentModel) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY c.componentModel ASC
            """)
    List<Component> findFiltered(
            @Param("producerId") Integer producerId,
            @Param("categoryId") Short categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("search") String search
    );
}
