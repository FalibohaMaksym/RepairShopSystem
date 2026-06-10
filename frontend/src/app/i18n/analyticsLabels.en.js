export const ANALYTICS_LABELS = {
    TITLE: "Business Analytics",
    FRESHNESS_PREFIX: "Data current as of: ",
    FRESHNESS_EMPTY: "Data not yet loaded to warehouse",
    TRIGGER_ETL_BTN: "Trigger initial load",
    EXECUTING: "Executing…",
    ETL_CONFIRM_TITLE: "Confirm initial load",
    ETL_CONFIRM_TEXT: "The process will run 4 stored procedures sequentially and may take several minutes. System performance may decrease during execution.",
    CANCEL: "Cancel",
    RUN: "Run",
    ETL_SUCCESS: "ETL process completed successfully.",
    ETL_ERROR_GENERAL: "Error starting ETL process.",
    ETL_ERROR_FORBIDDEN: "Insufficient permissions to start ETL (Senior Administrator role required).",
    ETL_ERROR_DETAILS: "Details: ",
    
    YEARS: "Years:",
    FROM: "From",
    TO: "To",
    GRANULARITY: "Granularity:",
    MONTH: "Month",
    QUARTER: "Quarter",
    YEAR: "Year",
    TAB_REPAIRS: "Repair Services",
    TAB_SUPPLIES: "Supply Analysis",
    
    NO_DATA: "No data to display",
    
    REPAIRS: {
        REVENUE_TITLE: "Revenue Dynamics",
        BY_CATEGORY: "By category",
        BY_BRANCH: "By branch",
        STRUCTURE_TITLE: "Service Structure",
        BRANCH: "Branch",
        ALL_BRANCHES: "All",
        SERVICES_COUNT_LABEL: "services",
        EFFICIENCY_TITLE: "Efficiency Matrix (by category)",
        SERVICE_QUANTITY: "Service Quantity",
        HOURLY_YIELD: "Hourly Yield",
        TOTAL_REVENUE: "Total Revenue"
    },
    
    SUPPLIES: {
        TREEMAP_TITLE: "Suppliers — Comparison Map",
        TREEMAP_SUB_VOL: "Cell size — total supplier volume",
        TREEMAP_SUB_LAT: "Cell size — average supplier latency (larger = worse)",
        SUPPLY_VOLUME: "Supply Volume",
        LATENCY: "Latency",
        RELIABILITY_TITLE: "Supplier Reliability",
        RELIABILITY_SUB: "Top 7 · Data for all time",
        PERCENT_FULFILLMENT: "% fulfillment",
        AVG_LATENCY_DAYS: "Average latency (days)",
        PERCENT_ORDER_FULFILLMENT: "% order fulfillment",
        TREND_TITLE: "Supply Latency Trend",
        DAYS: "Days",
        DAYS_SHORT: "d.",
        SUPPLIES_COUNT: "Supplies:",
        TOTAL_VOLUME: "Total volume:",
        AVG_LATENCY: "Avg latency:"
    },

    MONTHS_SHORT: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    MONTHS_FULL: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};
