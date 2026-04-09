package org.nulp.backend.repository;

import org.nulp.backend.entity.ItemInComponentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemInComponentOrderRepository extends JpaRepository<ItemInComponentOrder, Integer> {

    @Query("""
            SELECT iico FROM ItemInComponentOrder iico
            JOIN FETCH iico.component c
            LEFT JOIN FETCH c.producer
            LEFT JOIN FETCH c.componentCategory
            WHERE iico.componentOrder.id = :orderId
            """)
    List<ItemInComponentOrder> findByComponentOrderIdWithDetails(@Param("orderId") Integer orderId);

    @Query("""
            SELECT iico FROM ItemInComponentOrder iico
            WHERE iico.id = :id AND iico.componentOrder.id = :orderId
            """)
    Optional<ItemInComponentOrder> findByIdAndOrderId(
            @Param("id") Integer id,
            @Param("orderId") Integer orderId);

    @Query("""
            SELECT iico FROM ItemInComponentOrder iico
            JOIN FETCH iico.component c
            LEFT JOIN FETCH c.producer
            LEFT JOIN FETCH c.componentCategory
            JOIN iico.componentOrder co
            JOIN co.componentOrderStatus cos
            WHERE cos.componentOrderStatusName IN ('виконано', 'прострочено')
            """)
    List<ItemInComponentOrder> findArchivedWithDetails();
}
