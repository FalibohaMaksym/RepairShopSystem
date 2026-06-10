package org.nulp.backend.repository;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.response.ActiveOrderResponse;
import org.nulp.backend.dto.response.ArchiveOrderResponse;
import org.nulp.backend.dto.response.AvailableOrderResponse;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class OrderRepository {

    private final JdbcClient jdbcClient;

    public List<ActiveOrderResponse> findActiveOrdersByBranch(Integer branchId) {
        return jdbcClient
                .sql("EXEC dbo.usp_GetActiveRepairOrdersByBranch :branchId")
                .param("branchId", branchId)
                .query((rs, rowNum) -> new ActiveOrderResponse(
                        rs.getString("OrderNumber"),
                        rs.getString("OrderStatus"),
                        rs.getBigDecimal("OrderEstimatedPrice"),
                        rs.getTimestamp("OrderCreationTime") != null
                                ? rs.getTimestamp("OrderCreationTime").toLocalDateTime()
                                : null,
                        rs.getString("DeviceSerialNumber"),
                        rs.getString("DeviceModel"),
                        rs.getString("Producer"),
                        rs.getString("DeviceType"),
                        rs.getString("ProblemDescription")
                ))
                .list();
    }

    public List<ArchiveOrderResponse> findArchivedOrdersByBranch(Integer branchId) {
        return jdbcClient
                .sql("""
                        SELECT
                            o.OrderNumber,
                            os.OrderStatusName      AS OrderStatus,
                            o.OrderCreationTime,
                            o.OrderEstimatedPrice,
                            o.ProblemDescription,
                            cd.DeviceSerialNumber,
                            d.DeviceModel,
                            p.ProducerCompanyName   AS Producer,
                            dt.DeviceTypeName       AS DeviceType,
                            c.FullName              AS CustomerName,
                            c.PhoneNumber           AS CustomerPhone
                        FROM dbo.[Order] o
                        JOIN dbo.OrderStatus os   ON o.OrderStatusId    = os.OrderStatusPK
                        JOIN dbo.CustomerDevice cd ON o.CustomerDeviceId = cd.CustomerDevicePK
                        JOIN dbo.Device d          ON cd.DeviceId        = d.DevicePK
                        JOIN dbo.Producer p        ON d.ProducerId       = p.ProducerPK
                        JOIN dbo.DeviceType dt     ON d.DeviceTypeId     = dt.DeviceTypePK
                        JOIN dbo.Customer c        ON cd.CustomerId      = c.CustomerPK
                        LEFT JOIN dbo.Worker w     ON o.WorkerId         = w.WorkerPK
                        WHERE os.OrderStatusName IN (N'виконано', N'відмовлено')
                          AND (:branchId IS NULL OR w.BranchId = :branchId)
                        ORDER BY o.OrderCreationTime DESC
                        """)
                .param("branchId", branchId)
                .query((rs, rowNum) -> new ArchiveOrderResponse(
                        rs.getString("OrderNumber"),
                        rs.getString("OrderStatus"),
                        rs.getTimestamp("OrderCreationTime") != null
                                ? rs.getTimestamp("OrderCreationTime").toLocalDateTime() : null,
                        rs.getBigDecimal("OrderEstimatedPrice"),
                        rs.getString("ProblemDescription"),
                        rs.getString("DeviceSerialNumber"),
                        rs.getString("DeviceModel"),
                        rs.getString("Producer"),
                        rs.getString("DeviceType"),
                        rs.getString("CustomerName"),
                        rs.getString("CustomerPhone")
                ))
                .list();
    }

    public List<AvailableOrderResponse> findAvailableOrdersForWorker(Integer workerId) {
        return jdbcClient
                .sql("EXEC dbo.usp_PickOrdersForWorker :workerId")
                .param("workerId", workerId)
                .query((rs, rowNum) -> new AvailableOrderResponse(
                        rs.getString("OrderNumber"),
                        rs.getString("OrderStatus"),
                        rs.getTimestamp("OrderCreationTime") != null
                                ? rs.getTimestamp("OrderCreationTime").toLocalDateTime()
                                : null,
                        rs.getString("deviceModel"),
                        rs.getString("Producer"),
                        rs.getString("DeviceType"),
                        rs.getString("ProblemDescription"),
                        rs.getString("DiagnosticReason"),
                        rs.getString("DiagnosticSolution"),
                        rs.getTimestamp("DiagnosticFinishedAt") != null
                                ? rs.getTimestamp("DiagnosticFinishedAt").toLocalDateTime()
                                : null
                ))
                .list();
    }
}
