package org.nulp.backend.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class AnalyticsRepository {

    private final JdbcTemplate jdbcTemplate;

    // ── ETL ──────────────────────────────────────────────────────────────────

    public void runEtl() {
        jdbcTemplate.execute("EXEC [RepairShop_Staging].[dbo].[sp_CleanStagingDB]");
        jdbcTemplate.execute("EXEC [master].[dbo].[sp_InitialLoadToStaging]");
        jdbcTemplate.execute("EXEC [RepairShop_DWH].[dbo].[sp_CleanRepairShop_DWH]");
        jdbcTemplate.execute("EXEC [RepairShop_DWH].[dbo].[sp_InitialLoadToRepairShopDWH]");
    }

    public LocalDateTime queryLastLoadDatetime() {
        return jdbcTemplate.queryForObject(
                "SELECT TOP(1) load_datetime FROM [RepairShop_DWH_MetaData].[dbo].[DataLoadHistory] ORDER BY load_datetime DESC",
                LocalDateTime.class);
    }

    public Map<String, Object> queryAvailableYears() {
        String sql = """
                SELECT
                    ISNULL(MIN(yr), YEAR(GETDATE())) AS minYear,
                    ISNULL(MAX(yr), YEAR(GETDATE())) AS maxYear
                FROM (
                    SELECT MIN(ms.MonthSnapshotYear) AS yr
                    FROM [RepairShop_DWH].[dbo].[PeriodicFact_RepairService] f
                    JOIN [RepairShop_DWH].[dbo].[Dim_MonthSnapshot] ms ON f.MonthSnapshotId = ms.MonthSnapshotPK
                    UNION
                    SELECT MAX(ms.MonthSnapshotYear) AS yr
                    FROM [RepairShop_DWH].[dbo].[PeriodicFact_RepairService] f
                    JOIN [RepairShop_DWH].[dbo].[Dim_MonthSnapshot] ms ON f.MonthSnapshotId = ms.MonthSnapshotPK
                    UNION
                    SELECT MIN(sd.DateYear) AS yr
                    FROM [RepairShop_DWH].[dbo].[TransactionFact_Supply] f
                    JOIN [RepairShop_DWH].[dbo].[Dim_Date] sd ON f.SupplyDateId = sd.DatePK
                    UNION
                    SELECT MAX(sd.DateYear) AS yr
                    FROM [RepairShop_DWH].[dbo].[TransactionFact_Supply] f
                    JOIN [RepairShop_DWH].[dbo].[Dim_Date] sd ON f.SupplyDateId = sd.DatePK
                ) t
                """;
        try {
            return jdbcTemplate.queryForMap(sql);
        } catch (Exception e) {
            return Map.of("minYear", java.time.Year.now().getValue(), "maxYear", java.time.Year.now().getValue());
        }
    }

    // ── PeriodicFact_RepairService ────────────────────────────────────────────

    /**
     * Дохід по місяцях, згрупований за категорією послуг.
     * Повертає рядки: yr, mo, groupLabel, totalRevenue.
     */
    public List<Map<String, Object>> queryRevenueByCategory(int startYear, int endYear) {
        String sql = """
                SELECT
                    ms.MonthSnapshotYear  AS yr,
                    ms.MonthSnapshotMonth AS mo,
                    sc.ServiceCategoryName AS groupLabel,
                    SUM(f.TotalRevenuePerServiceCategory) AS totalRevenue
                FROM [RepairShop_DWH].[dbo].[PeriodicFact_RepairService] f
                JOIN [RepairShop_DWH].[dbo].[Dim_MonthSnapshot]    ms ON f.MonthSnapshotId  = ms.MonthSnapshotPK
                JOIN [RepairShop_DWH].[dbo].[Dim_ServiceCategory]  sc ON f.ServiceCategoryId = sc.ServiceCategoryPK
                WHERE ms.MonthSnapshotYear BETWEEN ? AND ?
                GROUP BY ms.MonthSnapshotYear, ms.MonthSnapshotMonth, sc.ServiceCategoryName
                ORDER BY ms.MonthSnapshotYear, ms.MonthSnapshotMonth
                """;
        return jdbcTemplate.queryForList(sql, startYear, endYear);
    }

    /**
     * Дохід по місяцях, згрупований за відділенням.
     * Повертає рядки: yr, mo, groupLabel, totalRevenue.
     */
    public List<Map<String, Object>> queryRevenueByBranch(int startYear, int endYear) {
        String sql = """
                SELECT
                    ms.MonthSnapshotYear  AS yr,
                    ms.MonthSnapshotMonth AS mo,
                    b.BranchAddress       AS groupLabel,
                    SUM(f.TotalRevenuePerServiceCategory) AS totalRevenue
                FROM [RepairShop_DWH].[dbo].[PeriodicFact_RepairService] f
                JOIN [RepairShop_DWH].[dbo].[Dim_MonthSnapshot] ms ON f.MonthSnapshotId = ms.MonthSnapshotPK
                JOIN [RepairShop_DWH].[dbo].[Dim_Branch]         b ON f.BranchId        = b.BranchPK
                WHERE ms.MonthSnapshotYear BETWEEN ? AND ?
                GROUP BY ms.MonthSnapshotYear, ms.MonthSnapshotMonth, b.BranchAddress
                ORDER BY ms.MonthSnapshotYear, ms.MonthSnapshotMonth
                """;
        return jdbcTemplate.queryForList(sql, startYear, endYear);
    }

    /**
     * Структура послуг (частка у %) для Donut Chart.
     * Якщо month == null — агрегація по всьому року (AVG sharePercent, SUM quantity/revenue).
     * Повертає рядки: category, sharePercent, quantity, totalRevenue.
     */
    public List<Map<String, Object>> queryStructure(int year, Integer month, Integer branchBusinessKey) {
        String sql = """
                SELECT
                    sc.ServiceCategoryName AS category,
                    AVG(f.ServiceCategorySharePercent_ByBranchMonth)  AS sharePercent,
                    SUM(f.ProvidedServicePerCategoryQuantity)          AS quantity,
                    SUM(f.TotalRevenuePerServiceCategory)              AS totalRevenue
                FROM [RepairShop_DWH].[dbo].[PeriodicFact_RepairService] f
                JOIN [RepairShop_DWH].[dbo].[Dim_ServiceCategory] sc ON f.ServiceCategoryId = sc.ServiceCategoryPK
                JOIN [RepairShop_DWH].[dbo].[Dim_MonthSnapshot]   ms ON f.MonthSnapshotId  = ms.MonthSnapshotPK
                JOIN [RepairShop_DWH].[dbo].[Dim_Branch]           b ON f.BranchId          = b.BranchPK
                WHERE ms.MonthSnapshotYear = ?
                  AND (? IS NULL OR ms.MonthSnapshotMonth = ?)
                  AND (? IS NULL OR b.BranchBusinessKey = ?)
                GROUP BY sc.ServiceCategoryName
                ORDER BY sharePercent DESC
                """;
        return jdbcTemplate.queryForList(sql, year, month, month, branchBusinessKey, branchBusinessKey);
    }

    /**
     * Матриця ефективності для Scatter Plot.
     * Повертає рядки: label, quantity, hourlyYield, totalRevenue.
     */
    public List<Map<String, Object>> queryEfficiency(int startYear, int endYear) {
        String sql = """
                SELECT
                    sc.ServiceCategoryName                         AS label,
                    SUM(f.ProvidedServicePerCategoryQuantity)      AS quantity,
                    AVG(f.HourlyYieldRevenue_ByServiceCategory)   AS hourlyYield,
                    SUM(f.TotalRevenuePerServiceCategory)          AS totalRevenue
                FROM [RepairShop_DWH].[dbo].[PeriodicFact_RepairService] f
                JOIN [RepairShop_DWH].[dbo].[Dim_ServiceCategory] sc ON f.ServiceCategoryId = sc.ServiceCategoryPK
                JOIN [RepairShop_DWH].[dbo].[Dim_MonthSnapshot]   ms ON f.MonthSnapshotId  = ms.MonthSnapshotPK
                WHERE ms.MonthSnapshotYear BETWEEN ? AND ?
                GROUP BY sc.ServiceCategoryName
                ORDER BY hourlyYield DESC
                """;
        return jdbcTemplate.queryForList(sql, startYear, endYear);
    }

    // ── TransactionFact_Supply ────────────────────────────────────────────────

    /**
     * Scatter Plot — затримки поставок.
     * Повертає рядки: supplyKey, orderNumber, supplier, volume, latency.
     */
    public List<Map<String, Object>> queryLatencyScatter(int startYear, int endYear) {
        String sql = """
                SELECT
                    f.SupplyBusinessKey      AS supplyKey,
                    co.ComponentOrderNumber  AS orderNumber,
                    s.CompanyName            AS supplier,
                    f.SupplyWeightedVolume   AS volume,
                    f.SupplyLatency          AS latency
                FROM [RepairShop_DWH].[dbo].[TransactionFact_Supply] f
                JOIN [RepairShop_DWH].[dbo].[Dim_Supplier]        s  ON f.SupplierId       = s.SupplierPK
                JOIN [RepairShop_DWH].[dbo].[Dim_Date]            sd ON f.SupplyDateId     = sd.DatePK
                JOIN [RepairShop_DWH].[dbo].[Dim_ComponentOrder]  co ON f.ComponentOrderId = co.ComponentOrderPK
                WHERE sd.DateYear BETWEEN ? AND ?
                ORDER BY f.SupplyLatency DESC
                """;
        return jdbcTemplate.queryForList(sql, startYear, endYear);
    }

    /**
     * Bar Chart — надійність постачальників.
     * Повертає рядки: supplier, avgLatency, avgPercentFromOrder.
     */
    public List<Map<String, Object>> querySupplierReliability() {
        String sql = """
                SELECT
                    s.CompanyName                                        AS supplier,
                    AVG(CAST(f.SupplyLatency AS DECIMAL(8, 2)))         AS avgLatency,
                    AVG(f.SupplyProcentFromOrder)                       AS avgPercentFromOrder
                FROM [RepairShop_DWH].[dbo].[TransactionFact_Supply] f
                JOIN [RepairShop_DWH].[dbo].[Dim_Supplier] s ON f.SupplierId = s.SupplierPK
                GROUP BY s.CompanyName
                ORDER BY avgLatency DESC
                """;
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Line Chart — тренд затримок по місяцях.
     * Повертає рядки: yr, mo, avgLatency.
     */
    public List<Map<String, Object>> querySupplyTrend(int startYear, int endYear) {
        String sql = """
                SELECT
                    sd.DateYear                                         AS yr,
                    sd.DateMonth                                        AS mo,
                    AVG(CAST(f.SupplyLatency AS DECIMAL(8, 2)))        AS avgLatency
                FROM [RepairShop_DWH].[dbo].[TransactionFact_Supply] f
                JOIN [RepairShop_DWH].[dbo].[Dim_Date] sd ON f.SupplyDateId = sd.DatePK
                WHERE sd.DateYear BETWEEN ? AND ?
                GROUP BY sd.DateYear, sd.DateMonth
                ORDER BY sd.DateYear, sd.DateMonth
                """;
        return jdbcTemplate.queryForList(sql, startYear, endYear);
    }
}
