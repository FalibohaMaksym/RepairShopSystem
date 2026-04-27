package org.nulp.backend.controller;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.response.analytics.AvailableYearsResponse;
import org.nulp.backend.dto.response.analytics.DataFreshnessResponse;
import org.nulp.backend.dto.response.analytics.EtlStatusResponse;
import org.nulp.backend.dto.response.analytics.RepairEfficiencyPoint;
import org.nulp.backend.dto.response.analytics.RepairStructureSlice;
import org.nulp.backend.dto.response.analytics.RevenueChartResponse;
import org.nulp.backend.dto.response.analytics.SupplierReliabilityBar;
import org.nulp.backend.dto.response.analytics.SupplyLatencyPoint;
import org.nulp.backend.dto.response.analytics.SupplyTrendPoint;
import org.nulp.backend.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // ── Метадані ─────────────────────────────────────────────────────────────

    /**
     * GET /api/analytics/freshness
     * Дата та час останнього успішного завантаження даних у сховище.
     */
    @GetMapping("/freshness")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<DataFreshnessResponse> getDataFreshness() {
        return ResponseEntity.ok(analyticsService.getDataFreshness());
    }

    /**
     * GET /api/analytics/available-years
     * Повертає мінімальний та максимальний рік, за які є дані в сховищі.
     */
    @GetMapping("/available-years")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<AvailableYearsResponse> getAvailableYears() {
        return ResponseEntity.ok(analyticsService.getAvailableYears());
    }

    // ── ETL ──────────────────────────────────────────────────────────────────

    /**
     * POST /api/analytics/etl/trigger-load
     * Запускає повний цикл ETL (4 збережені процедури послідовно).
     * Доступ: Старший адміністратор (та Системний адміністратор).
     */
    @PostMapping("/etl/trigger-load")
    @PreAuthorize("hasAnyAuthority('ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<EtlStatusResponse> triggerEtl() {
        return ResponseEntity.ok(analyticsService.triggerEtl());
    }

    // ── Repairs ──────────────────────────────────────────────────────────────

    /**
     * GET /api/analytics/repairs/revenue
     * Динаміка доходу — Stacked Bar / Line Chart.
     *
     * @param groupBy     "CATEGORY" (за замовч.) або "BRANCH"
     * @param granularity "MONTH" (за замовч.), "QUARTER" або "YEAR"
     * @param startYear   початковий рік (за замовч. поточний - 1)
     * @param endYear     кінцевий рік (за замовч. поточний)
     */
    @GetMapping("/repairs/revenue")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<RevenueChartResponse> getRepairRevenue(
            @RequestParam(defaultValue = "CATEGORY") String groupBy,
            @RequestParam(defaultValue = "MONTH")    String granularity,
            @RequestParam(defaultValue = "2025")     int startYear,
            @RequestParam(defaultValue = "2026")     int endYear) {
        return ResponseEntity.ok(
                analyticsService.getRepairRevenue(groupBy, granularity, startYear, endYear));
    }

    /**
     * GET /api/analytics/repairs/structure
     * Структура послуг — Donut Chart.
     *
     * @param year              рік місячного знімку
     * @param month             місяць місячного знімку
     * @param branchBusinessKey ID відділення (null — усі відділення)
     */
    @GetMapping("/repairs/structure")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<RepairStructureSlice>> getRepairStructure(
            @RequestParam int year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer branchBusinessKey) {
        return ResponseEntity.ok(
                analyticsService.getRepairStructure(year, month, branchBusinessKey));
    }

    /**
     * GET /api/analytics/repairs/efficiency
     * Матриця ефективності — Scatter Plot (кількість послуг vs прибутковість/год).
     */
    @GetMapping("/repairs/efficiency")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<RepairEfficiencyPoint>> getRepairEfficiency(
            @RequestParam(defaultValue = "2025") int startYear,
            @RequestParam(defaultValue = "2026") int endYear) {
        return ResponseEntity.ok(
                analyticsService.getRepairEfficiency(startYear, endYear));
    }

    // ── Supplies ─────────────────────────────────────────────────────────────

    /**
     * GET /api/analytics/supplies/latency
     * Аналіз затримок — Scatter Plot (об'єм vs затримка, колір — постачальник).
     */
    @GetMapping("/supplies/latency")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<SupplyLatencyPoint>> getSupplyLatency(
            @RequestParam(defaultValue = "2025") int startYear,
            @RequestParam(defaultValue = "2026") int endYear) {
        return ResponseEntity.ok(
                analyticsService.getSupplyLatencyScatter(startYear, endYear));
    }

    /**
     * GET /api/analytics/supplies/suppliers
     * Надійність постачальників — Bar Chart (середня затримка та % від замовлення).
     */
    @GetMapping("/supplies/suppliers")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<SupplierReliabilityBar>> getSupplierReliability() {
        return ResponseEntity.ok(analyticsService.getSupplierReliability());
    }

    /**
     * GET /api/analytics/supplies/trend
     * Тренд затримок — Line Chart (середня затримка по місяцях/кварталах/роках).
     *
     * @param granularity "MONTH" (за замовч.), "QUARTER" або "YEAR"
     */
    @GetMapping("/supplies/trend")
    @PreAuthorize("hasAnyAuthority('ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<SupplyTrendPoint>> getSupplyTrend(
            @RequestParam(defaultValue = "MONTH") String granularity,
            @RequestParam(defaultValue = "2025")  int startYear,
            @RequestParam(defaultValue = "2026")  int endYear) {
        return ResponseEntity.ok(
                analyticsService.getSupplyTrend(granularity, startYear, endYear));
    }
}
