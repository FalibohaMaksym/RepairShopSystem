package org.nulp.backend.repository;

import org.nulp.backend.entity.ItemInSupply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ItemInSupplyRepository extends JpaRepository<ItemInSupply, Integer> {

    /**
     * Всі позиції поставок для конкретного замовлення комплектуючих,
     * разом із даними поставки, комплектуючої та замовленої позиції.
     */
    @Query("""
            SELECT iis FROM ItemInSupply iis
            JOIN FETCH iis.supply s
            JOIN FETCH s.worker
            JOIN FETCH iis.itemInComponentOrder iico
            JOIN FETCH iico.component c
            LEFT JOIN FETCH c.producer
            LEFT JOIN FETCH c.componentCategory
            WHERE iico.componentOrder.id = :orderId
            ORDER BY s.id DESC
            """)
    List<ItemInSupply> findByComponentOrderIdWithDetails(@Param("orderId") Integer orderId);

    /**
     * Перевірка: чи є хоч одна поставка по замовленню.
     */
    boolean existsByItemInComponentOrder_ComponentOrder_Id(Integer orderId);

    /**
     * Сумарна поставлена кількість по кожній позиції замовлення.
     * Повертає пари [itemInComponentOrderId, suppliedQuantity].
     */
    @Query("""
            SELECT iis.itemInComponentOrder.id, SUM(iis.itemInSupplyQuantity)
            FROM ItemInSupply iis
            WHERE iis.itemInComponentOrder.componentOrder.id = :orderId
            GROUP BY iis.itemInComponentOrder.id
            """)
    List<Object[]> sumSuppliedByComponentOrderId(@Param("orderId") Integer orderId);

    /**
     * Сумарна поставлена кількість по кожній позиції для всіх архівних замовлень
     * (статуси 'виконано' та 'прострочено') — без IN-параметрів, щоб уникнути
     * обмеження SQL Server у 2100 параметрів.
     */
    @Query("""
            SELECT iis.itemInComponentOrder.id, SUM(iis.itemInSupplyQuantity)
            FROM ItemInSupply iis
            JOIN iis.itemInComponentOrder iico
            JOIN iico.componentOrder co
            JOIN co.componentOrderStatus cos
            WHERE cos.componentOrderStatusName IN ('виконано', 'прострочено')
            GROUP BY iis.itemInComponentOrder.id
            """)
    List<Object[]> sumSuppliedForArchived();
}
