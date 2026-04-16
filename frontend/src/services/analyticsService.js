import apiClient from '../app/auth/axiosConfig';

// ─── Repair analytics ─────────────────────────────────────────────────────────

/**
 * Revenue dynamics grouped by a dimension over time.
 * GET /api/analytics/repairs/revenue
 * Response: { labels: string[], series: [{ name: string, values: number[] }] }
 *
 * @param {{
 *   startYear: number,
 *   endYear: number,
 *   granularity: 'MONTH'|'QUARTER'|'YEAR',
 *   groupBy: 'CATEGORY'|'BRANCH',
 * }} params
 */
export const fetchRepairRevenue = async (params = {}) => {
    const response = await apiClient.get('/analytics/repairs/revenue', { params });
    return response.data ?? { labels: [], series: [] };
};

/**
 * Service category share for a specific month snapshot.
 * GET /api/analytics/repairs/structure
 * Response: [{ category, sharePercent, quantity, totalRevenue }]
 *
 * @param {{
 *   year: number,
 *   month: number,
 *   branchBusinessKey?: number|null,
 * }} params
 */
export const fetchRepairStructure = async (params = {}) => {
    const cleaned = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null && v !== '')
    );
    const response = await apiClient.get('/analytics/repairs/structure', { params: cleaned });
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Efficiency matrix — service quantity vs hourly yield per category.
 * GET /api/analytics/repairs/efficiency
 * Response: [{ label, quantity, hourlyYield, totalRevenue }]
 *
 * @param {{ startYear: number, endYear: number }} params
 */
export const fetchRepairEfficiency = async (params = {}) => {
    const response = await apiClient.get('/analytics/repairs/efficiency', { params });
    return Array.isArray(response.data) ? response.data : [];
};

// ─── Supply analytics ─────────────────────────────────────────────────────────

/**
 * Per-supply latency scatter (volume vs delay days, coloured by supplier).
 * GET /api/analytics/supplies/latency
 * Response: [{ supplyKey, supplier, volume, latency, orderNumber }]
 *
 * @param {{ startYear: number, endYear: number }} params
 */
export const fetchLatencyScatter = async (params = {}) => {
    const response = await apiClient.get('/analytics/supplies/latency', { params });
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Supplier reliability summary — no date params, aggregated over all DWH data.
 * GET /api/analytics/supplies/suppliers
 * Response: [{ supplier, avgLatency, avgPercentFromOrder }]
 */
export const fetchSupplierReliability = async () => {
    const response = await apiClient.get('/analytics/supplies/suppliers');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Average latency trend over time.
 * GET /api/analytics/supplies/trend
 * Response: [{ period, avgLatency }]
 *
 * @param {{ startYear: number, endYear: number, granularity: 'MONTH'|'QUARTER'|'YEAR' }} params
 */
export const fetchLatencyTrend = async (params = {}) => {
    const response = await apiClient.get('/analytics/supplies/trend', { params });
    return Array.isArray(response.data) ? response.data : [];
};

// ─── ETL ──────────────────────────────────────────────────────────────────────

/**
 * Triggers the full ETL pipeline (4 stored procedures sequentially).
 * POST /api/analytics/etl/trigger-load
 * Response: { success: boolean, message: string }
 * Always returns HTTP 200 — check `success` field for actual result.
 */
export const triggerEtlLoad = async () => {
    const response = await apiClient.post('/analytics/etl/trigger-load');
    return response.data;
};

/**
 * Fetches the last successful ETL load datetime from DWH metadata.
 * Endpoint: GET /api/analytics/freshness
 * @returns {Promise<{lastLoadDatetime: string|null}>}
 */
export const fetchAnalyticsFreshness = async () => {
    const response = await apiClient.get('/analytics/freshness');
    return response.data;
};

/**
 * Fetches the min and max years available in the Data Warehouse.
 * Endpoint: GET /api/analytics/available-years
 * @returns {Promise<{minYear: number, maxYear: number}>}
 */
export const fetchAvailableYears = async () => {
    const response = await apiClient.get('/analytics/available-years');
    return response.data;
};
