import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Badge,
    Box,
    Button,
    Chip,
    CircularProgress,
    Fade,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import dayjs from 'dayjs';
import { useLanguage } from '../../app/i18n/LanguageContext';
import { fetchArchivedComponentOrders, fetchSuppliers } from '../../services/componentOrderService';
import { fetchWorkers } from '../../services/usersService';
import ActiveSuppliesFilters from './components/ActiveSuppliesFilters';
import { filterToggleButtonSx } from '../repairs/ActiveRepairOrdersPage.styles';

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    'виконано': {
        cardBg:    { light: '#E8F5E9', dark: 'rgba(76,175,80,0.13)' },
        cardBorder:{ light: '#C8E6C9', dark: 'rgba(129,199,132,0.3)' },
        chipBg:    { light: '#A5D6A7', dark: 'rgba(76,175,80,0.35)' },
        chipColor: { light: '#1B5E20', dark: '#E8F5E9' },
        barColor:  '#66BB6A',
        label: 'Виконано',
    },
    'прострочено': {
        cardBg:    { light: '#FFF3E0', dark: 'rgba(239,108,0,0.12)' },
        cardBorder:{ light: '#FFE0B2', dark: 'rgba(255,167,38,0.3)' },
        chipBg:    { light: '#FFCC80', dark: 'rgba(239,108,0,0.35)' },
        chipColor: { light: '#7F3700', dark: '#FFF3E0' },
        barColor:  '#FFA726',
        label: 'Прострочено',
    },
};

const DEFAULT_STATUS = STATUS_CONFIG['виконано'];

const getStatusCfg = (status, isDark) => {
    const cfg = STATUS_CONFIG[status] ?? DEFAULT_STATUS;
    return {
        cardBg:     isDark ? cfg.cardBg.dark     : cfg.cardBg.light,
        cardBorder: isDark ? cfg.cardBorder.dark : cfg.cardBorder.light,
        chipBg:     isDark ? cfg.chipBg.dark     : cfg.chipBg.light,
        chipColor:  isDark ? cfg.chipColor.dark  : cfg.chipColor.light,
        barColor: cfg.barColor,
        label: cfg.label,
    };
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d)) return v;
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
};

const calcProgress = (items = []) => {
    const tot = items.reduce((s, i) => s + (i.orderedQuantity ?? 0), 0);
    const sup = items.reduce((s, i) => s + (i.suppliedQuantity ?? 0), 0);
    return tot === 0 ? 0 : Math.round((sup / tot) * 100);
};

const fmtAmount = (v) =>
    Number(v || 0).toLocaleString('uk-UA', { minimumFractionDigits: 2 }) + ' грн.';

// ─── OrderCard ─────────────────────────────────────────────────────────────────

const OrderCard = React.memo(({ order, isDark, onDetails, LA }) => {
    const cfg = getStatusCfg(order.status, isDark);
    const progress = calcProgress(order.items);
    const subtle = isDark ? 'rgba(230,237,243,0.7)' : '#5A6878';

    return (
        <Paper
            sx={{
                p: 1.5,
                bgcolor: cfg.cardBg,
                border: `1px solid ${cfg.cardBorder}`,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.8,
            }}
        >
            {/* Status chip */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Chip
                    label={cfg.label} size="small"
                    sx={{ bgcolor: cfg.chipBg, color: cfg.chipColor, fontWeight: 600, fontSize: '0.78rem', minWidth: 120 }}
                />
            </Box>

            {/* Order number + dates */}
            <Box>
                <Typography fontWeight={700} sx={{ fontSize: '0.95rem', mb: 0.1 }}>
                    {order.orderNumber}
                </Typography>
                <Typography sx={{ fontSize: '0.77rem', color: subtle }}>
                    {LA.ORDERED_AT}: {formatDate(order.orderDate)}
                </Typography>
                {order.expectedExecutionDate && (
                    <Typography sx={{ fontSize: '0.77rem', color: subtle }}>
                        {LA.EXPECTED_AT}: {formatDate(order.expectedExecutionDate)}
                    </Typography>
                )}
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, mt: 0.3 }}>
                    {fmtAmount(order.orderSum)}
                </Typography>
            </Box>

            {/* Items */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.7, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                {(order.items ?? []).slice(0, 3).map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                        <Typography noWrap sx={{ fontSize: '0.77rem', flex: 1 }} title={`${item.producer} ${item.componentModel}`}>
                            {item.producer} {item.componentModel}
                        </Typography>
                        <Typography sx={{ fontSize: '0.74rem', color: subtle, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {item.suppliedQuantity}/{item.orderedQuantity} {LA.PCS}
                        </Typography>
                    </Box>
                ))}
                {(order.items ?? []).length > 3 && (
                    <Typography sx={{ fontSize: '0.71rem', color: subtle, fontStyle: 'italic' }}>
                        + {LA.MORE_ITEMS} {order.items.length - 3} {LA.MORE_ITEMS_SUFFIX}
                    </Typography>
                )}
            </Box>

            {/* Progress */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.7 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography sx={{ fontSize: '0.77rem', color: subtle }}>{LA.PROGRESS}</Typography>
                    <Typography sx={{ fontSize: '0.77rem', fontWeight: 600 }}>{progress}%</Typography>
                </Box>
                <LinearProgress
                    variant="determinate" value={progress}
                    sx={{
                        height: 5, borderRadius: 3,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': { bgcolor: cfg.barColor, borderRadius: 3 },
                    }}
                />
            </Box>

            {/* Action */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.2 }}>
                <Button variant="contained" size="small" endIcon={<ArrowForwardIcon/>} onClick={onDetails}>
                    {LA.DETAILS_BUTTON}
                </Button>
            </Box>
        </Paper>
    );
});

// ─── ArchivedSuppliesPage ──────────────────────────────────────────────────────

const ArchivedSuppliesPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { labels } = useLanguage();
    const L = labels.supplies;
    const A = L.ARCHIVE;
    const isDark = theme.palette.mode === 'dark';

    // ── Toolbar state ──
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode]       = useState('DATE_DESC');
    const [filterOpen, setFilterOpen]   = useState(false);

    // ── Filter state ──
    const [selectedStatuses, setSelectedStatuses]     = useState(new Set());
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [selectedSuppliers, setSelectedSuppliers]   = useState(new Set());
    const [selectedWorkers, setSelectedWorkers]       = useState(new Set());
    const [selectedDelays, setSelectedDelays]         = useState(new Set());
    const [orderDateFrom, setOrderDateFrom]           = useState(null);
    const [orderDateTo, setOrderDateTo]               = useState(null);
    const [expectedDateFrom, setExpectedDateFrom]     = useState(null);
    const [expectedDateTo, setExpectedDateTo]         = useState(null);
    const [amountMin, setAmountMin]                   = useState('');
    const [amountMax, setAmountMax]                   = useState('');

    // ── Infinite scroll ──
    const BATCH = 12;
    const [displayCount, setDisplayCount] = useState(BATCH);
    const observerRef = useRef(null);

    const sentinelRef = useCallback((node) => {
        if (observerRef.current) observerRef.current.disconnect();
        if (!node) return;
        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setDisplayCount((prev) => prev + BATCH);
                }
            },
            { rootMargin: '400px' }
        );
        observerRef.current.observe(node);
    }, []);

    // ── Data state ──
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    // ── Load orders + mock supplierName / workerName ──
    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [data, suppliers, workers] = await Promise.all([
                fetchArchivedComponentOrders(),
                fetchSuppliers(),
                fetchWorkers(),
            ]);
            const enriched = data.map((order, i) => ({
                ...order,
                supplierName: suppliers[i % Math.max(suppliers.length, 1)]?.companyName ?? '—',
                workerName: workers[i % Math.max(workers.length, 1)]?.fullName ?? '—',
            }));
            setOrders(enriched);
        } catch {
            setError(A.LOAD_FAILED);
        } finally {
            setLoading(false);
        }
    }, [A.LOAD_FAILED]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    // ── Derived filter option lists ──
    const availableStatuses = useMemo(
        () => [...new Set(orders.map((o) => o.status))].filter(Boolean).sort(),
        [orders]
    );
    const availableCategories = useMemo(
        () => [...new Set(orders.flatMap((o) => (o.items ?? []).map((i) => i.componentCategory)))].filter(Boolean).sort(),
        [orders]
    );
    const availableSupplierNames = useMemo(
        () => [...new Set(orders.map((o) => o.supplierName))].filter(Boolean).sort(),
        [orders]
    );
    const availableWorkerNames = useMemo(
        () => [...new Set(orders.map((o) => o.workerName))].filter(Boolean).sort(),
        [orders]
    );

    // ── Amount range ──
    const amountRange = useMemo(() => {
        const amounts = orders.filter((o) => o.orderSum != null).map((o) => o.orderSum);
        return amounts.length > 0
            ? [Math.floor(Math.min(...amounts)), Math.ceil(Math.max(...amounts))]
            : [0, 100000];
    }, [orders]);
    const sliderMin = amountMin !== '' ? parseFloat(amountMin) : amountRange[0];
    const sliderMax = amountMax !== '' ? parseFloat(amountMax) : amountRange[1];

    // ── Order date range ──
    const orderDateRange = useMemo(() => {
        const ts = orders.filter((o) => o.orderDate).map((o) => dayjs(o.orderDate).valueOf());
        if (ts.length === 0) return [dayjs().subtract(90, 'day').startOf('day').valueOf(), dayjs().endOf('day').valueOf()];
        return [Math.min(...ts), Math.max(...ts)];
    }, [orders]);
    const orderDateSliderFrom = orderDateFrom ? orderDateFrom.startOf('day').valueOf() : orderDateRange[0];
    const orderDateSliderTo   = orderDateTo   ? orderDateTo.endOf('day').valueOf()     : orderDateRange[1];

    // ── Expected date range ──
    const expectedDateRange = useMemo(() => {
        const ts = orders.filter((o) => o.expectedExecutionDate).map((o) => dayjs(o.expectedExecutionDate).valueOf());
        if (ts.length === 0) return [dayjs().subtract(90, 'day').startOf('day').valueOf(), dayjs().add(90, 'day').endOf('day').valueOf()];
        return [Math.min(...ts), Math.max(...ts)];
    }, [orders]);
    const expectedDateSliderFrom = expectedDateFrom ? expectedDateFrom.startOf('day').valueOf() : expectedDateRange[0];
    const expectedDateSliderTo   = expectedDateTo   ? expectedDateTo.endOf('day').valueOf()     : expectedDateRange[1];

    // ── Active filter count ──
    const activeFilterCount =
        selectedStatuses.size +
        selectedCategories.size +
        selectedSuppliers.size +
        selectedWorkers.size +
        selectedDelays.size +
        (amountMin !== '' ? 1 : 0) +
        (amountMax !== '' ? 1 : 0) +
        (orderDateFrom != null ? 1 : 0) +
        (orderDateTo != null ? 1 : 0) +
        (expectedDateFrom != null ? 1 : 0) +
        (expectedDateTo != null ? 1 : 0);

    const clearFilters = () => {
        setSelectedStatuses(new Set());
        setSelectedCategories(new Set());
        setSelectedSuppliers(new Set());
        setSelectedWorkers(new Set());
        setSelectedDelays(new Set());
        setAmountMin('');
        setAmountMax('');
        setOrderDateFrom(null);
        setOrderDateTo(null);
        setExpectedDateFrom(null);
        setExpectedDateTo(null);
    };

    const isDelayed = useCallback((order) => {
        if (!order.expectedExecutionDate) return false;
        return dayjs(order.expectedExecutionDate).isBefore(dayjs(), 'day');
    }, []);

    // ── Filter + sort ──
    const STATUS_ORDER = { 'виконано': 0, 'прострочено': 1 };

    const visibleOrders = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        const filtered = orders.filter((order) => {
            if (q) {
                const hit =
                    order.orderNumber?.toLowerCase().includes(q) ||
                    (order.items ?? []).some((i) =>
                        i.componentModel?.toLowerCase().includes(q) ||
                        i.producer?.toLowerCase().includes(q) ||
                        i.componentCategory?.toLowerCase().includes(q)
                    );
                if (!hit) return false;
            }
            if (selectedStatuses.size > 0 && !selectedStatuses.has(order.status)) return false;
            if (selectedCategories.size > 0) {
                const cats = (order.items ?? []).map((i) => i.componentCategory);
                if (!cats.some((c) => selectedCategories.has(c))) return false;
            }
            if (selectedSuppliers.size > 0 && !selectedSuppliers.has(order.supplierName)) return false;
            if (selectedWorkers.size > 0 && !selectedWorkers.has(order.workerName)) return false;
            if (selectedDelays.size > 0 && selectedDelays.size < 2) {
                const delayed = isDelayed(order);
                if (selectedDelays.has('delayed') && !delayed) return false;
                if (selectedDelays.has('not_delayed') && delayed) return false;
            }
            if (orderDateFrom && order.orderDate && dayjs(order.orderDate).valueOf() < orderDateFrom.startOf('day').valueOf()) return false;
            if (orderDateTo && order.orderDate && dayjs(order.orderDate).valueOf() > orderDateTo.endOf('day').valueOf()) return false;
            if (expectedDateFrom && order.expectedExecutionDate && dayjs(order.expectedExecutionDate).valueOf() < expectedDateFrom.startOf('day').valueOf()) return false;
            if (expectedDateTo && order.expectedExecutionDate && dayjs(order.expectedExecutionDate).valueOf() > expectedDateTo.endOf('day').valueOf()) return false;
            if (amountMin !== '' && (order.orderSum == null || order.orderSum < parseFloat(amountMin))) return false;
            if (amountMax !== '' && (order.orderSum == null || order.orderSum > parseFloat(amountMax))) return false;
            return true;
        });

        return filtered.sort((a, b) => {
            const progA = calcProgress(a.items);
            const progB = calcProgress(b.items);
            switch (sortMode) {
                case 'DATE_DESC':     return new Date(b.orderDate || 0) - new Date(a.orderDate || 0);
                case 'DATE_ASC':      return new Date(a.orderDate || 0) - new Date(b.orderDate || 0);
                case 'AMOUNT_DESC':   return (b.orderSum ?? 0) - (a.orderSum ?? 0);
                case 'AMOUNT_ASC':    return (a.orderSum ?? 0) - (b.orderSum ?? 0);
                case 'PROGRESS_DESC': return progB - progA;
                case 'PROGRESS_ASC':  return progA - progB;
                case 'STATUS':        return (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
                default: return 0;
            }
        });
    }, [orders, searchQuery, sortMode, selectedStatuses, selectedCategories, selectedSuppliers, selectedWorkers, selectedDelays, orderDateFrom, orderDateTo, expectedDateFrom, expectedDateTo, amountMin, amountMax, isDelayed]);

    // Reset visible count when filters / search / sort change
    useEffect(() => { setDisplayCount(BATCH); }, [searchQuery, sortMode, selectedStatuses, selectedCategories, selectedSuppliers, selectedWorkers, selectedDelays, orderDateFrom, orderDateTo, expectedDateFrom, expectedDateTo, amountMin, amountMax]);

    return (
        <Box sx={{ width: '100%' }}>
            <Typography component="h1" variant="h4" fontWeight={600} sx={{ mb: 2.5, color: 'text.primary' }}>
                {A.PAGE_TITLE}
            </Typography>

            {/* Toolbar */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: filterOpen ? 1.5 : 2.5,
                flexWrap: 'wrap',
            }}>
                {/* Search */}
                <TextField
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={A.SEARCH_PLACEHOLDER}
                    size="small"
                    sx={{ flex: '1 1 280px', maxWidth: 440, bgcolor: 'background.paper', borderRadius: 1 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                {/* Filter toggle */}
                <Tooltip title={L.FILTER_BUTTON}>
                    <IconButton
                        onClick={() => setFilterOpen((p) => !p)}
                        sx={filterToggleButtonSx(filterOpen)}
                    >
                        <Badge
                            badgeContent={activeFilterCount}
                            color="primary"
                            max={9}
                            invisible={activeFilterCount === 0}
                        >
                            <FilterListIcon color="primary" />
                        </Badge>
                    </IconButton>
                </Tooltip>

                {/* Sort */}
                <FormControl size="small" sx={{ minWidth: 230, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <InputLabel id="archive-sort-label">{A.SORT_LABEL}</InputLabel>
                    <Select
                        labelId="archive-sort-label"
                        label={A.SORT_LABEL}
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                    >
                        <MenuItem value="DATE_DESC">{A.SORT_OPTIONS.DATE_DESC}</MenuItem>
                        <MenuItem value="DATE_ASC">{A.SORT_OPTIONS.DATE_ASC}</MenuItem>
                        <MenuItem value="AMOUNT_DESC">{A.SORT_OPTIONS.AMOUNT_DESC}</MenuItem>
                        <MenuItem value="AMOUNT_ASC">{A.SORT_OPTIONS.AMOUNT_ASC}</MenuItem>
                        <MenuItem value="PROGRESS_DESC">{A.SORT_OPTIONS.PROGRESS_DESC}</MenuItem>
                        <MenuItem value="PROGRESS_ASC">{A.SORT_OPTIONS.PROGRESS_ASC}</MenuItem>
                        <MenuItem value="STATUS">{A.SORT_OPTIONS.STATUS}</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* ── Filter panel (Collapse) ── */}
            <ActiveSuppliesFilters
                filterOpen={filterOpen}
                L={L}
                orderDateFrom={orderDateFrom}
                orderDateTo={orderDateTo}
                setOrderDateFrom={setOrderDateFrom}
                setOrderDateTo={setOrderDateTo}
                orderDateRange={orderDateRange}
                orderDateSliderFrom={orderDateSliderFrom}
                orderDateSliderTo={orderDateSliderTo}
                expectedDateFrom={expectedDateFrom}
                expectedDateTo={expectedDateTo}
                setExpectedDateFrom={setExpectedDateFrom}
                setExpectedDateTo={setExpectedDateTo}
                expectedDateRange={expectedDateRange}
                expectedDateSliderFrom={expectedDateSliderFrom}
                expectedDateSliderTo={expectedDateSliderTo}
                amountMin={amountMin}
                amountMax={amountMax}
                setAmountMin={setAmountMin}
                setAmountMax={setAmountMax}
                amountRange={amountRange}
                sliderMin={sliderMin}
                sliderMax={sliderMax}
                availableCategories={availableCategories}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                availableSuppliers={availableSupplierNames}
                selectedSuppliers={selectedSuppliers}
                setSelectedSuppliers={setSelectedSuppliers}
                availableWorkers={availableWorkerNames}
                selectedWorkers={selectedWorkers}
                setSelectedWorkers={setSelectedWorkers}
                selectedDelays={selectedDelays}
                setSelectedDelays={setSelectedDelays}
                availableStatuses={availableStatuses}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                activeFilterCount={activeFilterCount}
                clearFilters={clearFilters}
            />

            {/* States */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
                    <CircularProgress />
                </Box>
            )}
            {!loading && error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {!loading && !error && visibleOrders.length === 0 && (
                <Paper sx={{ p: 3, bgcolor: 'background.paper', border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                    <Typography color="text.secondary">{A.NO_RESULTS}</Typography>
                </Paper>
            )}

            {/* Cards grid */}
            {!loading && !error && visibleOrders.length > 0 && (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(260px, 1fr))', xl: 'repeat(3, minmax(260px, 1fr))' },
                    gap: 2,
                }}>
                    {visibleOrders.slice(0, displayCount).map((order, idx) => (
                        <Fade in appear timeout={Math.min(300 + (idx % BATCH) * 60, 800)} key={order.id}>
                            <Box>
                                <OrderCard
                                    order={order}
                                    isDark={isDark}
                                    onDetails={() => navigate(`/supplies/${order.id}`)}
                                    LA={L.ARCHIVE}
                                />
                            </Box>
                        </Fade>
                    ))}
                </Box>
            )}

            {/* Sentinel for infinite scroll */}
            {!loading && !error && displayCount < visibleOrders.length && (
                <Box ref={sentinelRef} sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={28} />
                </Box>
            )}
        </Box>
    );
};

export default ArchivedSuppliesPage;
