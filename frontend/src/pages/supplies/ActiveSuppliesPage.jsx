import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Badge,
    Box,
    Button,
    Chip,
    CircularProgress,
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
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FilterListIcon from '@mui/icons-material/FilterList';
import dayjs from 'dayjs';
import { useLanguage } from '../../app/i18n/LanguageContext';
import { fetchActiveComponentOrders, fetchSuppliers } from '../../services/componentOrderService';
import { fetchWorkers } from '../../services/usersService';
import StockTransferModal from './components/StockTransferModal';
import ComponentOrderModal from './components/ComponentOrderModal';
import ActiveSuppliesFilters from './components/ActiveSuppliesFilters';
import { filterToggleButtonSx } from '../repairs/ActiveRepairOrdersPage.styles';

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    'замовлено': {
        cardBg:   { light: '#D5E5F2', dark: 'rgba(66,165,245,0.16)' },
        cardBorder: { light: '#c1d5e6', dark: 'rgba(144,202,249,0.32)' },
        chipBg:   { light: '#A9D0F5', dark: 'rgba(66,165,245,0.34)' },
        chipColor: { light: '#1E3A5F', dark: '#E3F2FD' },
        barColor: '#64B5F6',
        label: 'Замовлено',
    },
    'виконується': {
        cardBg:   { light: '#E9D8EE', dark: 'rgba(186,104,200,0.16)' },
        cardBorder: { light: '#d8c2df', dark: 'rgba(206,147,216,0.32)' },
        chipBg:   { light: '#DDB9E5', dark: 'rgba(186,104,200,0.34)' },
        chipColor: { light: '#5A2A65', dark: '#F3E5F5' },
        barColor: '#B874CE',
        label: 'Виконується',
    },
};

const DEFAULT_STATUS = STATUS_CONFIG['замовлено'];

const getStatusCfg = (status, isDark) => {
    const cfg = STATUS_CONFIG[status] ?? DEFAULT_STATUS;
    return {
        cardBg: isDark ? cfg.cardBg.dark : cfg.cardBg.light,
        cardBorder: isDark ? cfg.cardBorder.dark : cfg.cardBorder.light,
        chipBg: isDark ? cfg.chipBg.dark : cfg.chipBg.light,
        chipColor: isDark ? cfg.chipColor.dark : cfg.chipColor.light,
        barColor: cfg.barColor,
        label: cfg.label,
    };
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
};

const calcProgress = (items = []) => {
    const totalOrdered = items.reduce((s, i) => s + (i.orderedQuantity ?? 0), 0);
    const totalSupplied = items.reduce((s, i) => s + (i.suppliedQuantity ?? 0), 0);
    if (totalOrdered === 0) return 0;
    return Math.round((totalSupplied / totalOrdered) * 100);
};

// ─── OrderCard ─────────────────────────────────────────────────────────────────

const OrderCard = React.memo(({ order, isDark, labels, onDetails }) => {
    const cfg = getStatusCfg(order.status, isDark);
    const progress = calcProgress(order.items);
    const textColor = isDark ? undefined : '#1E2A36';
    const subtleColor = isDark ? 'rgba(230,237,243,0.7)' : '#5A6878';

    return (
        <Paper
            sx={{
                p: 1.5,
                bgcolor: cfg.cardBg,
                border: `1px solid ${cfg.cardBorder}`,
                boxShadow: '0px 2px 8px rgba(0,0,0,0.16)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                color: textColor,
            }}
        >
            {/* Status chip */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Chip
                    label={cfg.label}
                    size="small"
                    sx={{ bgcolor: cfg.chipBg, color: cfg.chipColor, minWidth: 120, fontWeight: 500 }}
                />
            </Box>

            {/* Order number + dates + sum */}
            <Box>
                <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>
                    {order.orderNumber}
                </Typography>
                <Typography variant="body2" sx={{ color: subtleColor }}>
                    {labels.CREATED_AT}: {formatDate(order.orderDate)}
                </Typography>
                {order.expectedExecutionDate && (
                    <Typography variant="body2" sx={{ color: subtleColor }}>
                        {labels.EXPECTED_DATE}: {formatDate(order.expectedExecutionDate)}
                    </Typography>
                )}
                {order.orderSum != null && (
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.3 }}>
                        {labels.AMOUNT}: {Number(order.orderSum).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {labels.CURRENCY}
                    </Typography>
                )}
            </Box>

            {/* Items list */}
            <Box
                sx={{
                    flex: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    pt: 0.8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.4,
                }}
            >
                {(order.items ?? []).slice(0, 4).map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                        <Typography
                            noWrap
                            sx={{ fontSize: '0.78rem', flex: 1 }}
                            title={`${item.producer} ${item.componentModel}`}
                        >
                            {item.producer} {item.componentModel}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: subtleColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {item.suppliedQuantity}/{item.orderedQuantity} шт.
                        </Typography>
                    </Box>
                ))}
                {(order.items ?? []).length > 4 && (
                    <Typography sx={{ fontSize: '0.72rem', color: subtleColor, fontStyle: 'italic' }}>
                        + ще {order.items.length - 4} поз.
                    </Typography>
                )}
            </Box>

            {/* Progress */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography variant="body2" sx={{ color: subtleColor }}>
                        {labels.PROGRESS}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                        {progress}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': { bgcolor: cfg.barColor, borderRadius: 3 },
                    }}
                />
            </Box>

            {/* Action */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="small" endIcon={<ArrowForwardIcon />} onClick={onDetails}>
                    {labels.DETAILS_BUTTON}
                </Button>
            </Box>
        </Paper>
    );
});

// ─── ActiveSuppliesPage ────────────────────────────────────────────────────────

const ActiveSuppliesPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { labels } = useLanguage();
    const L = labels.supplies;
    const isDark = theme.palette.mode === 'dark';

    // ── Toolbar state ──
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState('DATE_DESC');
    const [filterOpen, setFilterOpen] = useState(false);

    // ── Filter state ──
    const [selectedStatuses, setSelectedStatuses] = useState(new Set());
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [selectedSuppliers, setSelectedSuppliers] = useState(new Set());
    const [selectedWorkers, setSelectedWorkers] = useState(new Set());
    const [selectedDelays, setSelectedDelays] = useState(new Set());
    const [orderDateFrom, setOrderDateFrom] = useState(null);
    const [orderDateTo, setOrderDateTo] = useState(null);
    const [expectedDateFrom, setExpectedDateFrom] = useState(null);
    const [expectedDateTo, setExpectedDateTo] = useState(null);
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');

    // ── Data state ──
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [orderModalOpen, setOrderModalOpen] = useState(false);

    // ── Load orders + mock supplierName / workerName ──
    const loadOrders = useCallback(async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const [data, suppliers, workers] = await Promise.all([
                fetchActiveComponentOrders(),
                fetchSuppliers(),
                fetchWorkers(),
            ]);
            // Mock: API doesn't return supplierName/workerName on active list yet
            const enriched = data.map((order, i) => ({
                ...order,
                supplierName: suppliers[i % Math.max(suppliers.length, 1)]?.companyName ?? '—',
                workerName: workers[i % Math.max(workers.length, 1)]?.fullName ?? '—',
            }));
            setOrders(enriched);
        } catch {
            setErrorMessage(L.LOAD_FAILED);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [L.LOAD_FAILED]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

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

    /** Determine if an order is delayed (expected date in the past). */
    const isDelayed = useCallback((order) => {
        if (!order.expectedExecutionDate) return false;
        return dayjs(order.expectedExecutionDate).isBefore(dayjs(), 'day');
    }, []);

    // ── Filter + sort ──
    const visibleOrders = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        const filtered = orders.filter((order) => {
            // text search
            if (q) {
                const matchOrder = order.orderNumber?.toLowerCase().includes(q);
                const matchItem = (order.items ?? []).some(
                    (item) =>
                        item.componentModel?.toLowerCase().includes(q) ||
                        item.producer?.toLowerCase().includes(q) ||
                        item.componentCategory?.toLowerCase().includes(q)
                );
                if (!matchOrder && !matchItem) return false;
            }

            // status
            if (selectedStatuses.size > 0 && !selectedStatuses.has(order.status)) return false;

            // category — match if any item in order has a selected category
            if (selectedCategories.size > 0) {
                const orderCats = (order.items ?? []).map((i) => i.componentCategory);
                if (!orderCats.some((c) => selectedCategories.has(c))) return false;
            }

            // supplier (mocked)
            if (selectedSuppliers.size > 0 && !selectedSuppliers.has(order.supplierName)) return false;

            // worker (mocked)
            if (selectedWorkers.size > 0 && !selectedWorkers.has(order.workerName)) return false;

            // delays
            if (selectedDelays.size > 0 && selectedDelays.size < 2) {
                const delayed = isDelayed(order);
                if (selectedDelays.has('delayed') && !delayed) return false;
                if (selectedDelays.has('not_delayed') && delayed) return false;
            }

            // order date range
            if (orderDateFrom && order.orderDate && dayjs(order.orderDate).valueOf() < orderDateFrom.startOf('day').valueOf()) return false;
            if (orderDateTo && order.orderDate && dayjs(order.orderDate).valueOf() > orderDateTo.endOf('day').valueOf()) return false;

            // expected date range
            if (expectedDateFrom && order.expectedExecutionDate && dayjs(order.expectedExecutionDate).valueOf() < expectedDateFrom.startOf('day').valueOf()) return false;
            if (expectedDateTo && order.expectedExecutionDate && dayjs(order.expectedExecutionDate).valueOf() > expectedDateTo.endOf('day').valueOf()) return false;

            // amount range
            if (amountMin !== '' && (order.orderSum == null || order.orderSum < parseFloat(amountMin))) return false;
            if (amountMax !== '' && (order.orderSum == null || order.orderSum > parseFloat(amountMax))) return false;

            return true;
        });

        return filtered.sort((a, b) => {
            const progA = calcProgress(a.items);
            const progB = calcProgress(b.items);
            switch (sortMode) {
                case 'DATE_ASC':    return new Date(a.orderDate) - new Date(b.orderDate);
                case 'DATE_DESC':   return new Date(b.orderDate) - new Date(a.orderDate);
                case 'AMOUNT_ASC':  return (a.orderSum ?? 0) - (b.orderSum ?? 0);
                case 'AMOUNT_DESC': return (b.orderSum ?? 0) - (a.orderSum ?? 0);
                case 'PROGRESS_ASC':  return progA - progB;
                case 'PROGRESS_DESC': return progB - progA;
                default: return 0;
            }
        });
    }, [orders, searchQuery, sortMode, selectedStatuses, selectedCategories, selectedSuppliers, selectedWorkers, selectedDelays, orderDateFrom, orderDateTo, expectedDateFrom, expectedDateTo, amountMin, amountMax, isDelayed]);

    return (
        <>
            <Box sx={{ width: '100%' }}>
                <Typography component="h1" variant="h4" fontWeight={600} sx={{ mb: 2.5, color: 'text.primary' }}>
                    {L.PAGE_TITLE}
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
                        placeholder={L.SEARCH_PLACEHOLDER}
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
                    <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <InputLabel id="supply-sort-label">{L.SORT_LABEL}</InputLabel>
                        <Select
                            labelId="supply-sort-label"
                            label={L.SORT_LABEL}
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value)}
                        >
                            <MenuItem value="DATE_DESC">{L.SORT_OPTIONS.DATE_DESC}</MenuItem>
                            <MenuItem value="DATE_ASC">{L.SORT_OPTIONS.DATE_ASC}</MenuItem>
                            <MenuItem value="AMOUNT_DESC">{L.SORT_OPTIONS.AMOUNT_DESC}</MenuItem>
                            <MenuItem value="AMOUNT_ASC">{L.SORT_OPTIONS.AMOUNT_ASC}</MenuItem>
                            <MenuItem value="PROGRESS_DESC">{L.SORT_OPTIONS.PROGRESS_DESC}</MenuItem>
                            <MenuItem value="PROGRESS_ASC">{L.SORT_OPTIONS.PROGRESS_ASC}</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Spacer */}
                    <Box sx={{ flexGrow: 1 }} />

                    {/* Create order */}
                    <Button
                        variant="contained"
                        onClick={() => setOrderModalOpen(true)}
                        sx={{ whiteSpace: 'nowrap', py: 1.2, px: 3, fontWeight: 500 }}
                    >
                        {L.CREATE_BUTTON}
                    </Button>

                    {/* Transfer */}
                    <Button
                        variant="outlined"
                        startIcon={<SwapHorizIcon />}
                        onClick={() => setTransferModalOpen(true)}
                        sx={{
                            px: 2, py: 1, whiteSpace: 'nowrap',
                            borderColor: '#B874CE', color: '#B874CE',
                            '&:hover': { borderColor: '#A45DBB', bgcolor: 'rgba(184,116,206,0.06)' },
                        }}
                    >
                        {L.TRANSFER_BUTTON}
                    </Button>
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && errorMessage && (
                    <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>
                )}

                {!loading && !errorMessage && visibleOrders.length === 0 && (
                    <Paper sx={{ p: 2, bgcolor: '#f5f7fa', border: '1px dashed #c4ccd5' }}>
                        <Typography color="text.secondary" textAlign="center">
                            {L.NO_RESULTS}
                        </Typography>
                    </Paper>
                )}

                {/* Order cards */}
                {!loading && !errorMessage && visibleOrders.length > 0 && (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(260px, 1fr))',
                                xl: 'repeat(3, minmax(260px, 1fr))',
                            },
                            gap: 2,
                        }}
                    >
                        {visibleOrders.map((order) => (
                            <OrderCard
                                key={order.id ?? order.orderNumber}
                                order={order}
                                isDark={isDark}
                                labels={L}
                                onDetails={() => navigate(`/supplies/${order.id}`)}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            <StockTransferModal
                open={transferModalOpen}
                onClose={() => setTransferModalOpen(false)}
                mode="admin"
            />

            <ComponentOrderModal
                open={orderModalOpen}
                onClose={() => setOrderModalOpen(false)}
                onOrderCreated={loadOrders}
            />
        </>
    );
};

export default ActiveSuppliesPage;
