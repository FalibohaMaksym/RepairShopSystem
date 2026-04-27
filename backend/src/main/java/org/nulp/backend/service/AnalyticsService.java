package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.nulp.backend.dto.response.analytics.AvailableYearsResponse;
import org.nulp.backend.dto.response.analytics.DataFreshnessResponse;
import org.nulp.backend.dto.response.analytics.EtlStatusResponse;
import org.nulp.backend.dto.response.analytics.RepairEfficiencyPoint;
import org.nulp.backend.dto.response.analytics.RepairStructureSlice;
import org.nulp.backend.dto.response.analytics.RevenueChartResponse;
import org.nulp.backend.dto.response.analytics.SupplierReliabilityBar;
import org.nulp.backend.dto.response.analytics.SupplyLatencyPoint;
import org.nulp.backend.dto.response.analytics.SupplyTrendPoint;
import org.nulp.backend.repository.AnalyticsRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    // ── ETL ──────────────────────────────────────────────────────────────────

    public DataFreshnessResponse getDataFreshness() {
        return new DataFreshnessResponse(analyticsRepository.queryLastLoadDatetime());
    }

    public AvailableYearsResponse getAvailableYears() {
        Map<String, Object> result = analyticsRepository.queryAvailableYears();
        return new AvailableYearsResponse(
                ((Number) result.get("minYear")).intValue(),
                ((Number) result.get("maxYear")).intValue()
        );
    }

    public EtlStatusResponse triggerEtl() {
        try {
            log.info("Запуск ETL-процесу...");
            analyticsRepository.runEtl();
            log.info("ETL-процес завершено успішно");
            return new EtlStatusResponse(true, "ETL завершено успішно. Дані сховища оновлено.");
        } catch (Exception e) {
            log.error("Помилка ETL-процесу: {}", e.getMessage(), e);
            return new EtlStatusResponse(false, "Помилка під час ETL: " + e.getMessage());
        }
    }

    // ── Repairs ──────────────────────────────────────────────────────────────

    /**
     * Динаміка доходу — Stacked Bar / Line Chart.
     *
     * @param groupBy     "CATEGORY" або "BRANCH"
     * @param granularity "MONTH", "QUARTER" або "YEAR"
     * @param startYear   початковий рік фільтру
     * @param endYear     кінцевий рік фільтру
     */
    public RevenueChartResponse getRepairRevenue(String groupBy, String granularity,
                                                  int startYear, int endYear) {
        List<Map<String, Object>> rows = "BRANCH".equalsIgnoreCase(groupBy)
                ? analyticsRepository.queryRevenueByBranch(startYear, endYear)
                : analyticsRepository.queryRevenueByCategory(startYear, endYear);

        // Крок 1: зводимо плоскі рядки у Map<period, Map<label, revenue>>
        // Використовуємо LinkedHashMap щоб зберегти хронологічний порядок
        Map<String, Map<String, BigDecimal>> pivot = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            int yr = ((Number) row.get("yr")).intValue();
            int mo = ((Number) row.get("mo")).intValue();
            String label = (String) row.get("groupLabel");
            BigDecimal revenue = toBigDecimal(row.get("totalRevenue"));

            String period = buildPeriod(yr, mo, granularity);
            pivot.computeIfAbsent(period, k -> new LinkedHashMap<>())
                 .merge(label, revenue, BigDecimal::add);
        }

        // Крок 2: збираємо всі унікальні назви серій (категорій / відділень)
        List<String> allLabels = rows.stream()
                .map(r -> (String) r.get("groupLabel"))
                .distinct()
                .toList();

        List<String> periods = new ArrayList<>(pivot.keySet());

        // Крок 3: будуємо серії
        List<RevenueChartResponse.Series> series = allLabels.stream()
                .map(name -> {
                    List<BigDecimal> values = periods.stream()
                            .map(p -> pivot.get(p).getOrDefault(name, BigDecimal.ZERO))
                            .toList();
                    return new RevenueChartResponse.Series(name, values);
                })
                .toList();

        return new RevenueChartResponse(periods, series);
    }

    /**
     * Структура послуг — Donut Chart.
     *
     * @param year              рік місячного знімку
     * @param month             місяць (null — агрегація по всьому року)
     * @param branchBusinessKey ID відділення (null — усі відділення)
     */
    public List<RepairStructureSlice> getRepairStructure(int year, Integer month,
                                                          Integer branchBusinessKey) {
        return analyticsRepository.queryStructure(year, month, branchBusinessKey)
                .stream()
                .map(row -> new RepairStructureSlice(
                        (String) row.get("category"),
                        toBigDecimal(row.get("sharePercent")),
                        ((Number) row.get("quantity")).intValue(),
                        toBigDecimal(row.get("totalRevenue"))
                ))
                .toList();
    }

    /**
     * Матриця ефективності — Scatter Plot.
     * X — кількість послуг, Y — прибутковість за годину.
     */
    public List<RepairEfficiencyPoint> getRepairEfficiency(int startYear, int endYear) {
        return analyticsRepository.queryEfficiency(startYear, endYear)
                .stream()
                .map(row -> new RepairEfficiencyPoint(
                        (String) row.get("label"),
                        ((Number) row.get("quantity")).intValue(),
                        toBigDecimal(row.get("hourlyYield")),
                        toBigDecimal(row.get("totalRevenue"))
                ))
                .toList();
    }

    // ── Supplies ─────────────────────────────────────────────────────────────

    /**
     * Аналіз затримок — Scatter Plot.
     * X — об'єм поставки, Y — затримка в днях, колір — постачальник.
     */
    public List<SupplyLatencyPoint> getSupplyLatencyScatter(int startYear, int endYear) {
        return analyticsRepository.queryLatencyScatter(startYear, endYear)
                .stream()
                .map(row -> new SupplyLatencyPoint(
                        ((Number) row.get("supplyKey")).intValue(),
                        (String) row.get("orderNumber"),
                        (String) row.get("supplier"),
                        toBigDecimal(row.get("volume")),
                        ((Number) row.get("latency")).intValue()
                ))
                .toList();
    }

    /**
     * Надійність постачальників — Bar Chart.
     * Середня затримка та середній % виконання замовлення по постачальнику.
     */
    public List<SupplierReliabilityBar> getSupplierReliability() {
        return analyticsRepository.querySupplierReliability()
                .stream()
                .map(row -> new SupplierReliabilityBar(
                        (String) row.get("supplier"),
                        toBigDecimal(row.get("avgLatency")),
                        toBigDecimal(row.get("avgPercentFromOrder"))
                ))
                .toList();
    }

    /**
     * Тренд затримок — Line Chart.
     *
     * @param granularity "MONTH", "QUARTER" або "YEAR"
     */
    public List<SupplyTrendPoint> getSupplyTrend(String granularity, int startYear, int endYear) {
        List<Map<String, Object>> rows = analyticsRepository.querySupplyTrend(startYear, endYear);

        // Агрегуємо по грануляції — для MONTH вже готово, для QUARTER/YEAR мерджимо
        Map<String, List<BigDecimal>> grouped = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            int yr = ((Number) row.get("yr")).intValue();
            int mo = ((Number) row.get("mo")).intValue();
            String period = buildPeriod(yr, mo, granularity);
            grouped.computeIfAbsent(period, k -> new ArrayList<>())
                   .add(toBigDecimal(row.get("avgLatency")));
        }

        return grouped.entrySet().stream()
                .map(e -> {
                    List<BigDecimal> vals = e.getValue();
                    BigDecimal avg = vals.stream()
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .divide(BigDecimal.valueOf(vals.size()), 2, RoundingMode.HALF_UP);
                    return new SupplyTrendPoint(e.getKey(), avg);
                })
                .toList();
    }

    // ── Допоміжні методи ─────────────────────────────────────────────────────

    private String buildPeriod(int year, int month, String granularity) {
        return switch (granularity.toUpperCase()) {
            case "YEAR"    -> String.valueOf(year);
            case "QUARTER" -> year + "-Q" + ((month - 1) / 3 + 1);
            default        -> String.format("%d-%02d", year, month); // MONTH
        };
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        return new BigDecimal(value.toString());
    }
}
