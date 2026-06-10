import React, { useEffect, useMemo, useState } from 'react';
import {
    Box, FormControl, InputLabel, MenuItem, Paper,
    Select, ToggleButton, ToggleButtonGroup, Typography, useTheme,
} from '@mui/material';
import {
    ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell,
    ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid,
    Tooltip, Legend,
} from 'recharts';
import {
    fetchRepairRevenue,
    fetchRepairStructure,
    fetchRepairEfficiency,
} from '../../../services/analyticsService';
import { fetchBranches } from '../../../services/stockService';
import ChartCard from './ChartCard';
import { useLanguage } from '../../../app/i18n/LanguageContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = [
    '#1976D2', '#BA68C8', '#43A047', '#FB8C00', '#E53935',
    '#00ACC1', '#5C6BC0', '#26A69A', '#FF7043', '#8D6E63',
];

const CURRENT_YEAR = new Date().getFullYear();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v) =>
    `${Number(v).toLocaleString('uk-UA', { maximumFractionDigits: 0 })} грн`;

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

/**
 * Converts the { labels, series } response format into recharts-compatible rows.
 * Output: { data: [{ period, "Series A": val, ... }], dimensions: ["Series A", ...] }
 */
const transformRevenueSeries = ({ labels = [], series = [] }) => {
    const data = labels.map((label, i) => {
        const row = { period: label };
        series.forEach((s) => { row[s.name] = s.values?.[i] ?? 0; });
        return row;
    });
    return { data, dimensions: series.map((s) => s.name) };
};

// ─── Shared tooltip ───────────────────────────────────────────────────────────

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

const EmptyChart = ({ height = 260, text }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
        <Typography sx={{ fontSize: '0.85rem', color: 'text.disabled', fontStyle: 'italic' }}>
            {text}
        </Typography>
    </Box>
);

// ─── 1. Revenue Dynamics ──────────────────────────────────────────────────────

/** Truncates a long branch address to a readable short form. */
const shortLabel = (label, maxLen = 28) =>
    label && label.length > maxLen ? `${label.slice(0, maxLen - 1)}…` : label;

const RevenueChart = React.memo(({ startYear, endYear, granularity, refreshTrigger }) => {
    const { labels } = useLanguage();
    const l = labels.analytics;

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const axisColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';

    const [groupBy, setGroupBy]       = useState('CATEGORY');
    const [rawResp, setRawResp]       = useState({ labels: [], series: [] });
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [hiddenSeries, setHiddenSeries] = useState(new Set());

    // Reset hidden series when groupBy dimension changes
    useEffect(() => { setHiddenSeries(new Set()); }, [groupBy]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        fetchRepairRevenue({ startYear, endYear, granularity, groupBy })
            .then((d) => { if (!cancelled) setRawResp(d); })
            .catch(() => { if (!cancelled) setError('Не вдалося завантажити дані доходів.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [startYear, endYear, granularity, groupBy, refreshTrigger]);

    const { data, dimensions } = useMemo(
        () => transformRevenueSeries(rawResp),
        [rawResp]
    );

    const toggleSeries = (name) =>
        setHiddenSeries((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });

    const controls = (
        <ToggleButtonGroup
            size="small"
            exclusive
            value={groupBy}
            onChange={(_, v) => { if (v) setGroupBy(v); }}
        >
            <ToggleButton value="CATEGORY" sx={{ fontSize: '0.72rem', px: 1.2 }}>{l.REPAIRS.BY_CATEGORY}</ToggleButton>
            <ToggleButton value="BRANCH"   sx={{ fontSize: '0.72rem', px: 1.2 }}>{l.REPAIRS.BY_BRANCH}</ToggleButton>
        </ToggleButtonGroup>
    );

    return (
        <ChartCard title={l.REPAIRS.REVENUE_TITLE} controls={controls} loading={loading} error={error} minHeight={320}>
            {data.length === 0 ? <EmptyChart height={300} text={l.NO_DATA} /> : (
                <>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis
                                dataKey="period"
                                tickFormatter={(p) => fmtPeriod(p, granularity, l)}
                                tick={{ fill: axisColor, fontSize: 11 }}
                            />
                            <YAxis
                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                tick={{ fill: axisColor, fontSize: 11 }}
                                width={52}
                            />
                            <Tooltip
                                content={<ChartTooltip formatValue={(v) => fmtCurrency(v)} />}
                                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                            />
                            {dimensions.map((dim, i) => (
                                <Bar
                                    key={dim}
                                    dataKey={dim}
                                    stackId="stack"
                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                    hide={hiddenSeries.has(dim)}
                                    radius={i === dimensions.length - 1 ? [3, 3, 0, 0] : undefined}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Custom scrollable legend — handles large number of series gracefully */}
                    <Box
                        sx={{
                            mt: 1,
                            pt: 1,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            maxHeight: 100,
                            overflowY: 'auto',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.4,
                        }}
                    >
                        {dimensions.map((dim, i) => {
                            const color   = CHART_COLORS[i % CHART_COLORS.length];
                            const hidden  = hiddenSeries.has(dim);
                            return (
                                <Box
                                    key={dim}
                                    onClick={() => toggleSeries(dim)}
                                    title={dim}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.6,
                                        px: 0.8,
                                        py: 0.35,
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        opacity: hidden ? 0.3 : 1,
                                        transition: 'opacity 0.15s',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <Box sx={{
                                        width: 10, height: 10,
                                        borderRadius: '2px',
                                        bgcolor: color,
                                        flexShrink: 0,
                                        ...(hidden && { outline: `1.5px solid ${color}`, bgcolor: 'transparent' }),
                                    }} />
                                    <Typography noWrap sx={{ fontSize: '0.72rem', maxWidth: 200, lineHeight: 1.3 }}>
                                        {shortLabel(dim)}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </>
            )}
        </ChartCard>
    );
});
RevenueChart.displayName = 'RevenueChart';

// ─── 2. Service Structure (Donut) ─────────────────────────────────────────────

const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.04) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 11, fontWeight: 600 }}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const ServiceStructureChart = React.memo(({ yearOptions = [], refreshTrigger }) => {
    const { labels } = useLanguage();
    const l = labels.analytics;

    const [level, setLevel]         = useState('MONTH');   // 'MONTH' | 'YEAR'
    
    // Automatically fallback if yearOptions is somehow empty or doesn't include CURRENT_YEAR
    const defaultYear = yearOptions.includes(CURRENT_YEAR) ? CURRENT_YEAR : (yearOptions[yearOptions.length - 1] || CURRENT_YEAR);
    const [year, setYear]           = useState(defaultYear);
    
    // Ensure month does not exceed current month if current year is selected
    const actualCurrentMonth = new Date().getMonth() + 1;
    const isCurrentYear = Number(year) === CURRENT_YEAR;
    const maxMonth = isCurrentYear ? actualCurrentMonth : 12;
    
    const [month, setMonth]         = useState(() => Math.min(actualCurrentMonth, maxMonth));
    const [branchKey, setBranchKey] = useState('');
    const [branches, setBranches]   = useState([]);
    const [data, setData]           = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');

    useEffect(() => {
        // If year changes to current year and selected month is in the future, reset it
        if (isCurrentYear && month > actualCurrentMonth) {
            setMonth(actualCurrentMonth);
        }
    }, [year, month, isCurrentYear, actualCurrentMonth]);

    useEffect(() => {
        fetchBranches().then(setBranches).catch(() => {});
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        // When level=YEAR — don't send month; backend aggregates the whole year
        const params = {
            year,
            ...(level === 'MONTH' ? { month } : {}),
            branchBusinessKey: branchKey || undefined,
        };
        fetchRepairStructure(params)
            .then((d) => { if (!cancelled) setData(d); })
            .catch(() => { if (!cancelled) setError('Не вдалося завантажити дані.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [level, year, month, branchKey, refreshTrigger]);

    const controls = (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            {/* Aggregation level toggle */}
            <ToggleButtonGroup
                size="small"
                exclusive
                value={level}
                onChange={(_, v) => { if (v) setLevel(v); }}
            >
                <ToggleButton value="MONTH" sx={{ fontSize: '0.72rem', px: 1.2 }}>{l.MONTH}</ToggleButton>
                <ToggleButton value="YEAR"  sx={{ fontSize: '0.72rem', px: 1.2 }}>{l.YEAR}</ToggleButton>
            </ToggleButtonGroup>

            {/* Year selector */}
            <FormControl size="small" sx={{ minWidth: 88 }}>
                <InputLabel sx={{ fontSize: '0.78rem' }}>{l.YEAR}</InputLabel>
                <Select label={l.YEAR} value={yearOptions.includes(year) ? year : ''} onChange={(e) => setYear(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                    {yearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
            </FormControl>

            {/* Month selector — only when level=MONTH */}
            {level === 'MONTH' && (
                <FormControl size="small" sx={{ minWidth: 118 }}>
                    <InputLabel sx={{ fontSize: '0.78rem' }}>{l.MONTH}</InputLabel>
                    <Select label={l.MONTH} value={month} onChange={(e) => setMonth(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                        {l.MONTHS_FULL.map((name, i) => {
                            const monthNumber = i + 1;
                            if (monthNumber > maxMonth) return null;
                            return <MenuItem key={monthNumber} value={monthNumber}>{name}</MenuItem>;
                        })}
                    </Select>
                </FormControl>
            )}

            {/* Branch selector */}
            {branches.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel sx={{ fontSize: '0.78rem' }}>{l.REPAIRS.BRANCH}</InputLabel>
                    <Select
                        label={l.REPAIRS.BRANCH}
                        value={branchKey}
                        onChange={(e) => setBranchKey(e.target.value)}
                        sx={{ fontSize: '0.78rem' }}
                    >
                        <MenuItem value="">{l.REPAIRS.ALL_BRANCHES}</MenuItem>
                        {branches.map((b) => (
                            <MenuItem key={b.id} value={b.id}>{b.address}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>
    );

    return (
        <ChartCard title={l.REPAIRS.STRUCTURE_TITLE} controls={controls} loading={loading} error={error} minHeight={260}>
            {data.length === 0 ? <EmptyChart height={260} text={l.NO_DATA} /> : (
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={105}
                            paddingAngle={2}
                            dataKey="sharePercent"
                            nameKey="category"
                            labelLine={false}
                            label={renderPieLabel}
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(v, _name, props) => {
                                const p = props.payload;
                                const parts = [`${Number(v).toFixed(1)}%`];
                                if (p.quantity != null)     parts.push(`${Number(p.quantity).toLocaleString('uk-UA')} ${l.REPAIRS.SERVICES_COUNT_LABEL}`);
                                if (p.totalRevenue != null) parts.push(fmtCurrency(p.totalRevenue));
                                return [parts.join(' · '), p.category];
                            }}
                        />
                        <Legend
                            formatter={(_value, entry) => entry.payload.category}
                            wrapperStyle={{ fontSize: '0.78rem' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </ChartCard>
    );
});
ServiceStructureChart.displayName = 'ServiceStructureChart';

// ─── 3. Efficiency Matrix (Scatter) ──────────────────────────────────────────

const EfficiencyTooltip = ({ active, payload, l }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <Paper elevation={4} sx={{ p: 1.5 }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, mb: 0.5, color: 'text.primary' }}>{d.label}</Typography>
            <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
                {l.REPAIRS.SERVICE_QUANTITY}: <b>{Number(d.quantity).toLocaleString('uk-UA')}</b>
            </Typography>
            <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
                {l.REPAIRS.HOURLY_YIELD}: <b>{fmtCurrency(d.hourlyYield)}</b>
            </Typography>
            {d.totalRevenue != null && (
                <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
                    {l.REPAIRS.TOTAL_REVENUE}: <b>{fmtCurrency(d.totalRevenue)}</b>
                </Typography>
            )}
        </Paper>
    );
};

const ColoredDot = ({ cx, cy, index }) => (
    <circle
        cx={cx} cy={cy} r={7}
        fill={CHART_COLORS[index % CHART_COLORS.length]}
        stroke="white" strokeWidth={1.5}
        fillOpacity={0.85}
    />
);

const EfficiencyChart = React.memo(({ startYear, endYear, refreshTrigger }) => {
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
        // No groupByDimension — backend always returns by category
        fetchRepairEfficiency({ startYear, endYear })
            .then((d) => { if (!cancelled) setData(d); })
            .catch(() => { if (!cancelled) setError('Не вдалося завантажити дані.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [startYear, endYear, refreshTrigger]);

    return (
        <ChartCard title={l.REPAIRS.EFFICIENCY_TITLE} loading={loading} error={error} minHeight={260}>
            {data.length === 0 ? <EmptyChart height={260} text={l.NO_DATA} /> : (
                <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top: 10, right: 20, left: 8, bottom: 22 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                            dataKey="quantity"
                            name={l.REPAIRS.SERVICE_QUANTITY}
                            type="number"
                            label={{ value: l.REPAIRS.SERVICE_QUANTITY, position: 'insideBottom', offset: -14, fontSize: 11, fill: axisColor }}
                            tick={{ fill: axisColor, fontSize: 11 }}
                        />
                        <YAxis
                            dataKey="hourlyYield"
                            name={l.REPAIRS.HOURLY_YIELD}
                            type="number"
                            tickFormatter={(v) => {
                                if (v >= 10000) return `${(v / 1000).toFixed(0)}k`;
                                if (v >= 1000)  return `${(v / 1000).toFixed(1)}k`;
                                return String(Math.round(v));
                            }}
                            tick={{ fill: axisColor, fontSize: 11 }}
                            width={52}
                        />
                        <Tooltip content={<EfficiencyTooltip l={l} />} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter data={data} shape={<ColoredDot />} />
                    </ScatterChart>
                </ResponsiveContainer>
            )}
        </ChartCard>
    );
});
EfficiencyChart.displayName = 'EfficiencyChart';

// ─── Section export ───────────────────────────────────────────────────────────

const RepairAnalyticsSection = ({ startYear, endYear, granularity, yearOptions, refreshTrigger }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <RevenueChart startYear={startYear} endYear={endYear} granularity={granularity} refreshTrigger={refreshTrigger} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr' }, gap: 2.5 }}>
            <ServiceStructureChart yearOptions={yearOptions} refreshTrigger={refreshTrigger} />
            <EfficiencyChart startYear={startYear} endYear={endYear} refreshTrigger={refreshTrigger} />
        </Box>
    </Box>
);

export default RepairAnalyticsSection;
