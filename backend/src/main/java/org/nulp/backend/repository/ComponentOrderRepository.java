package org.nulp.backend.repository;

import org.nulp.backend.entity.ComponentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ComponentOrderRepository extends JpaRepository<ComponentOrder, Integer> {

    @Query("SELECT MAX(co.componentOrderNumber) FROM ComponentOrder co")
    Optional<String> findMaxOrderNumber();

    @Query("""
            SELECT co FROM ComponentOrder co
            JOIN FETCH co.supplier
            JOIN FETCH co.componentOrderStatus
            WHERE co.id = :id
            """)
    Optional<ComponentOrder> findByIdWithDetails(@Param("id") Integer id);

    @Query("""
            SELECT co FROM ComponentOrder co
            JOIN FETCH co.supplier
            JOIN FETCH co.componentOrderStatus cos
            WHERE cos.componentOrderStatusName IN ('виконано', 'прострочено')
            ORDER BY co.componentOrderCreatedAt DESC
            """)
    List<ComponentOrder> findAllArchived();

    /**
     * Активні замовлення комплектуючих (статуси: замовлено, виконується).
     * Відсоток виконання = SUM(поставлено * ціна) / SUM(замовлено * ціна) * 100
     */
    @Query(value = """
            SELECT
                co.ComponentOrderPK              AS id,
                co.ComponentOrderNumber          AS orderNumber,
                co.ComponentOrderCreatedAt       AS createdAt,
                co.EstimatedOrderSum             AS estimatedSum,
                co.ExpectedExecutionDate         AS expectedExecutionDate,
                cos.ComponentOrderStatusName     AS statusName,
                CASE
                    WHEN SUM(iico.ItemsQuantity * iico.UnitPrice) = 0 OR SUM(iico.ItemsQuantity * iico.UnitPrice) IS NULL
                        THEN 0
                    ELSE CAST(
                        ISNULL(SUM(supplied.suppliedValue), 0) * 100.0
                        / SUM(iico.ItemsQuantity * iico.UnitPrice)
                    AS DECIMAL(5,2))
                END AS completionPercentage
            FROM dbo.ComponentOrder co
            JOIN dbo.ComponentOrderStatus cos
                ON co.ComponentOrderStatusId = cos.ComponentOrderStatusPK
            LEFT JOIN dbo.ItemInComponentOrder iico
                ON iico.ComponentOrderId = co.ComponentOrderPK
            LEFT JOIN (
                SELECT
                    iis.ItemInComponentOrderId,
                    SUM(iis.ItemInSupplyQuantity * iico2.UnitPrice) AS suppliedValue
                FROM dbo.ItemInSupply iis
                JOIN dbo.ItemInComponentOrder iico2
                    ON iis.ItemInComponentOrderId = iico2.ItemInComponentOrderPK
                GROUP BY iis.ItemInComponentOrderId
            ) supplied ON supplied.ItemInComponentOrderId = iico.ItemInComponentOrderPK
            WHERE cos.ComponentOrderStatusName IN (N'замовлено', N'виконується')
            GROUP BY
                co.ComponentOrderPK,
                co.ComponentOrderNumber,
                co.ComponentOrderCreatedAt,
                co.EstimatedOrderSum,
                co.ExpectedExecutionDate,
                cos.ComponentOrderStatusName
            ORDER BY co.ComponentOrderCreatedAt DESC
            """, nativeQuery = true)
    List<Object[]> findActiveWithCompletionPercentage();
}
