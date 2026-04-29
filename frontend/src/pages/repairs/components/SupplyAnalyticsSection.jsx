import React, { useEffect, useMemo, useState } from 'react';
import {
    Box, Paper, ToggleButton, ToggleButtonGroup, Typography, useTheme,
} from '@mui/material';
import {
    ResponsiveContainer,
    Treemap,
    BarChart, Bar,
    LineChart, Line,
    XAxis, YAxis, CartesianGrid,
    Tooltip, Legend,
} from 'recharts';
import {
    fetchLatencyScatter,
    fetchSupplierReliability,
    fetchLatencyTrend,
} from '../../../services/analyticsService';
import ChartCard from './ChartCard';
import { useLanguage } from '../../../app/i18n/LanguageContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = [
    '#BA68C8', '#1976D2', '#43A047', '#FB8C00', '#E53935',
    '#00ACC1', '#5C6BC0', '#26A69A', '#FF7043', '#8D6E63',
    '#F06292', '#4DB6AC', '#FFB74D', '#64B5F6', '#A1887F',
    '#90A4AE', '#CE93D8', '#80DEEA', '#BCAAA4', '#EF9A9A',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDays = (v, l) => `${Number(v).toFixed(1)} ${l.SUPPLIES.DAYS_SHORT}`;
const fmtPct  = (v) => `${Number(v).toFixed(1)}%`;
const fmtVol  = (v) => {
    const n = Number(v);
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
    return String(Math.round(n));
};

const fmtPeriod = (period, granularity, l) => {
    if (!period) return period;
    if (granularity === 'YEAR') return period;
    if (granularity === 'QUARTER') {
        const [year, q] = period.split('-');
        return `${q} ${year}`;
    }
    const [year, month] = period.split('-');
    const m = parseInt(month, 10);
    return `${l.MONTHS_SHORT[m - 1] ?? month} ${year}`;
};

// ─── Shared components ────────────────────────────────────────────────────────

const EmptyChart = ({ height = 260, text }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
        <Typography sx={{ fontSize: '0.85rem', color: 'text.disabled', fontStyle: 'italic' }}>
            {text}
        </Typography>
    </Box>
);

const ChartTooltip = ({ active, payload, label, formatValue }) => {
    if (!active || !payload?.length) return null;
    return (
        <Paper elevation={4} sx={{ p: 1.5, minWidth: 150, maxWidth: 260 }}>
            {label && (
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                    {label}
                </Typography>
            )}
            {payload.map((p, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', flex: 1 }}>{p.name}:</Typography>
                    <Typography sx={{ fontSize: '0.76rem', fontWeight: 600 }}>
                        {formatValue ? formatValue(p.value, p.name) : p.value}
                    </Typography>
                </Box>
            ))}
        </Paper>
    );
};

// ─── 1. Supplier Treemap ──────────────────────────────────────────────────────

/** Tooltip shown on hover over a treemap cell */
const TreemapTooltip = ({ active, payload, l }) => {
    if (!active || !payload?.length) return null;
    // Recharts Treemap puts the data item in payload[0].payload (or sometimes directly)
    const d = payload[0]?.payload ?? payload[0];
    if (!d?.name) return null;
    return (
        <Paper elevation={4} sx={{ p: 1.5, minWidth: 170 }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, mb: 0.6, color: 'text.primary' }}>
                {d.name}
            </Typography>
            <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
                {l.SUPPLIES.SUPPLIES_COUNT} <b>{Number(d.supplyCount).toLocaleString('uk-UA')}</b>
            </Typography>
            <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
                {l.SUPPLIES.TOTAL_VOLUME} <b>{Number(d.totalVolume).toLocaleString('uk-UA', { maximumFractionDigits: 1 })}</b>
            </Typography>
            <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
                {l.SUPPLIES.AVG_LATENCY} <b>{fmtDays(d.avgLatency, l)}</b>
            </Typography>
        </Paper>
    );
};

/** SVG cell rendered for each supplier in the treemap */
const TreemapCell = (props) => {
    const { x, y, width, height, name, totalVolume, avgLatency, color, metric, l } = props;

    const canShowName  = width > 44 && height > 20;
    const canShowValue = width > 54 && height > 42;
    const fontSize = Math.max(9, Math.min(12, Math.floor(width / 9)));
    const maxChars = Math.max(3, Math.floor(width / (fontSize * 0.62)));
    const displayName = name
        ? (name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name)
        : '';
    const valueText = metric === 'volume' ? fmtVol(totalVolume) : fmtDays(avgLatency, l);

    return (
        <g>
            <rect
                x={x + 1} y={y + 1}
                width={Math.max(0, width - 2)}
                height={Math.max(0, height - 2)}
                fill={color ?? '#1976D2'}
                fillOpacity={0.84}
                rx={3}
            />
            {canShowName && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + (canShowValue ? -8 : 0)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    style={{ fontSize, fontWeight: 600, pointerEvents: 'none' }}
                >
                    {displayName}
                </text>
            )}
            {canShowValue && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 10}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="rgba(255,255,255,0.8)"
                    style={{ fontSize: Math.max(9, fontSize - 1), pointerEvents: 'none' }}
                >
                    {valueText}
                </text>
            )}
        </g>
    );
};

const SupplierTreemapChart = React.memo(({ startYear, endYear, refreshTrigger }) => {
    const { labels } = useLanguage();
    const l = labels.analytics;

    const [metric, setMetric]   = useState('volume');
    const [data, setData]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        fetchLatencyScatter({ startYear, endYear })
            .then((d) => { if (!cancelled) setData(d); })
            .catch(() => { if (!cancelled) setError('Не вдалося завантажити дані.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [startYear, endYear, refreshTrigger]);

    // Assign stable color per supplier (sorted alphabetically → same color regardless of metric)
    const supplierColorMap = useMemo(() => {
        const names = [...new Set(data.map((d) => d.supplier))].sort();
        const map = new Map();
        names.forEach((name, i) => map.set(name, CHART_COLORS[i % CHART_COLORS.length]));
        return map;
    }, [data]);

    // Aggregate per supplier, compute treemap `size` based on selected metric
    const treemapData = useMemo(() => {
        const map = new Map();
        data.forEach((d) => {
            if (!map.has(d.supplier)) {
                map.set(d.supplier, { name: d.supplier, vol: 0, lat: 0, cnt: 0 });
            }
            const s = map.get(d.supplier);
            s.vol += d.volume  ?? 0;
            s.lat += d.latency ?? 0;
            s.cnt += 1;
        });

        return Array.from(map.values())
            .map((s) => {
                const avgLatency = s.cnt > 0 ? +(s.lat / s.cnt).toFixed(2) : 0;
                const size = metric === 'volume'
                    ? Math.max(1, Math.round(s.vol))
                    : Math.max(0.01, avgLatency);
                return {
                    name:        s.name,
                    size,
                    totalVolume: +s.vol.toFixed(2),
                    avgLatency,
                    supplyCount: s.cnt,
                    color:       supplierColorMap.get(s.name) ?? CHART_COLORS[0],
                };
            })
            .filter((s) => s.size > 0)
            .sort((a, b) => b.size - a.size);
    }, [data, metric, supplierColorMap]);

    const controls = (
        <ToggleButtonGroup
            size="small"
            exclusive
            value={metric}
            onChange={(_, v) => { if (v) setMetric(v); }}
        >
            <ToggleButton value="volume"  sx={{ fontSize: '0.72rem', px: 1.2 }}>{l.SUPPLIES.SUPPLY_VOLUME}</ToggleButton>
            <ToggleButton value="latency" sx={{ fontSize: '0.72rem', px: 1.2 }}>{l.SUPPLIES.LATENCY}</ToggleButton>
        </ToggleButtonGroup>
    );

    const subtitle = metric === 'volume'
        ? l.SUPPLIES.TREEMAP_SUB_VOL
        : l.SUPPLIES.TREEMAP_SUB_LAT;

    return (
        <ChartCard
            title={l.SUPPLIES.TREEMAP_TITLE}
            controls={controls}
            loading={loading}
            error={error}
            minHeight={340}
        >
            <Typography sx={{ fontSize: '0.74rem', color: 'text.disabled', mb: 1, fontStyle: 'italic' }}>
                {subtitle}
            </Typography>
            {treemapData.length === 0 ? <EmptyChart height={320} text={l.NO_DATA} /> : (
                <ResponsiveContainer width="100%" height={340}>
                    <Treemap
                        data={treemapData}
                        dataKey="size"
                        stroke="transparent"
                        isAnimationActive={false}
                        content={<TreemapCell metric={metric} l={l} />}
                    >
                        <Tooltip content={<TreemapTooltip l={l} />} />
                    </Treemap>
                </ResponsiveContainer>
            )}
        </ChartCard>
    );
});
SupplierTreemapChart.displayName = 'SupplierTreemapChart';

// ─── 2. Supplier Reliability ──────────────────────────────────────────────────

const SupplierReliabilityChart = React.memo(({ refreshTrigger }) => {
    const { labels } = useLanguage();
    const l = labels.analytics;

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const axisColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';

    const [metric, setMetric]   = useState('avgLatency');
    const [data, setData]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        fetchSupplierReliability()
            .then((d) => { if (!cancelled) setData(d); })
            .catch(() => { if (!cancelled) setError('Не вдалося завантажити дані.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [refreshTrigger]);

    const sorted = useMemo(
        () => [...data].sort((a, b) => b[metric] - a[metric]).slice(0, 7),
        [data, metric]
    );

    const isLatency   = metric === 'avgLatency';
    const barColor    = isLatency ? '#BA68C8' : '#1976D2';
    const formatTip   = isLatency ? (v) => fmtDays(v, l) : fmtPct;
    const metricLabel = isLatency ? l.SUPPLIES.AVG_LATENCY_DAYS : l.SUPPLIES.PERCENT_ORDER_FULFILLMENT;

    const controls = (
        <ToggleButtonGroup
            size="small"
            exclusive
            value={metric}
            onChange={(_, v) => { if (v) setMetric(v); }}
        >
            <ToggleButton value="avgLatency"          sx={{ fontSize: '0.72rem', px: 1.2 }}>{l.SUPPLIES.LATENCY}</ToggleButton>
            <ToggleButton value="avgPercentFromOrder" sx={{ fontSize: '0.72rem', px: 1.2 }}>{l.SUPPLIES.PERCENT_FULFILLMENT}</ToggleButton>
        </ToggleButtonGroup>
    );

    const barHeight = Math.max(220, sorted.length * 44);

    return (
        <ChartCard title={l.SUPPLIES.RELIABILITY_TITLE} controls={controls} loading={loading} error={error} minHeight={260}>
            <Typography sx={{ fontSize: '0.74rem', color: 'text.disabled', mb: 1, fontStyle: 'italic' }}>
                {l.SUPPLIES.RELIABILITY_SUB}
            </Typography>
            {sorted.length === 0 ? <EmptyChart height={220} text={l.NO_DATA} /> : (
                <ResponsiveContainer width="100%" height={barHeight}>
                    <BarChart
                        data={sorted}
                        layout="vertical"
                        margin={{ top: 4, right: 54, left: 0, bottom: 4 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                        <XAxis
                            type="number"
                            tick={{ fill: axisColor, fontSize: 11 }}
                            tickFormatter={isLatency ? (v) => `${v}` : (v) => `${v}%`}
                        />
                        <YAxis
                            dataKey="supplier"
                            type="category"
                            tick={{ fill: axisColor, fontSize: 11 }}
                            width={120}
                        />
                        <Tooltip
                            content={<ChartTooltip formatValue={(v) => formatTip(v)} />}
                            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                        />
                        <Bar
                            dataKey={metric}
                            name={metricLabel}
                            fill={barColor}
                            radius={[0, 4, 4, 0]}
                            label={{
                                position: 'right',
                                fontSize: 11,
                                fill: axisColor,
                                formatter: (v) => formatTip(v),
                            }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </ChartCard>
    );
});
SupplierReliabilityChart.displayName = 'SupplierReliabilityChart';

// ─── 3. Latency Trend (Line) ──────────────────────────────────────────────────

const LatencyTrendChart = React.memo(({ startYear, endYear, granularity, refreshTrigger }) => {
    const { labels } = useLanguage();
    const l = labels.analytics;

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const axisColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';

    const [data, setData]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        fetchLatencyTrend({ startYear, endYear, granularity })
            .then((d) => { if (!cancelled) setData(d); })
            .catch(() => { if (!cancelled) setError('Не вдалося завантажити дані.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [startYear, endYear, granularity, refreshTrigger]);

    return (
        <ChartCard title={l.SUPPLIES.TREND_TITLE} loading={loading} error={error} minHeight={260}>
            {data.length === 0 ? <EmptyChart height={260} text={l.NO_DATA} /> : (
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data} margin={{ top: 10, right: 20, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                            dataKey="period"
                            tickFormatter={(p) => fmtPeriod(p, granularity, l)}
                            tick={{ fill: axisColor, fontSize: 11 }}
                        />
                        <YAxis
                            tick={{ fill: axisColor, fontSize: 11 }}
                            label={{ value: l.SUPPLIES.DAYS, angle: -90, position: 'insideLeft', offset: 12, fontSize: 11, fill: axisColor }}
                            width={44}
                        />
                        <Tooltip content={<ChartTooltip formatValue={(v) => fmtDays(v, l)} />} />
                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                        <Line
                            type="monotone"
                            dataKey="avgLatency"
                            name={l.SUPPLIES.AVG_LATENCY_DAYS}
                            stroke={CHART_COLORS[0]}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: CHART_COLORS[0], strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </ChartCard>
    );
});
LatencyTrendChart.displayName = 'LatencyTrendChart';

// ─── Section export ───────────────────────────────────────────────────────────

const SupplyAnalyticsSection = ({ startYear, endYear, granularity, refreshTrigger }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SupplierTreemapChart startYear={startYear} endYear={endYear} refreshTrigger={refreshTrigger} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
            <SupplierReliabilityChart refreshTrigger={refreshTrigger} />
            <LatencyTrendChart startYear={startYear} endYear={endYear} granularity={granularity} refreshTrigger={refreshTrigger} />
        </Box>
    </Box>
);

export default SupplyAnalyticsSection;
