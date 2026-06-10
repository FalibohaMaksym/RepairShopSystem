import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
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
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import dayjs from 'dayjs';
import { useLanguage } from '../../app/i18n/LanguageContext';
import { fetchArchivedOrders } from '../../services/ordersService';
import ActiveOrdersFilters from './components/ActiveOrdersFilters';
import { filterToggleButtonSx, pageTitleSx } from './ActiveRepairOrdersPage.styles';

// ─── Status config (ключі = значення orderStatus з API) ───────────────────────

const STATUS_CONFIG = {
    'виконано': {
        cardBg:    { light: '#E8F5E9', dark: 'rgba(76,175,80,0.13)' },
        cardBorder:{ light: '#C8E6C9', dark: 'rgba(129,199,132,0.3)' },
        chipBg:    { light: '#A5D6A7', dark: 'rgba(76,175,80,0.35)' },
        chipColor: { light: '#1B5E20', dark: '#E8F5E9' },
        labelKey: 'STATUS_COMPLETED',
        Icon: CheckCircleOutlinedIcon,
    },
    'відмовлено': {
        cardBg:    { light: '#FFF3E0', dark: 'rgba(239,108,0,0.12)' },
        cardBorder:{ light: '#FFE0B2', dark: 'rgba(255,167,38,0.3)' },
        chipBg:    { light: '#FFCC80', dark: 'rgba(239,108,0,0.35)' },
        chipColor: { light: '#7F3700', dark: '#FFF3E0' },
        labelKey: 'STATUS_REJECTED',
        Icon: CancelOutlinedIcon,
    },
};

const getStatusCfg = (status, isDark, L) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['виконано'];
    return {
        cardBg:     isDark ? cfg.cardBg.dark     : cfg.cardBg.light,
        cardBorder: isDark ? cfg.cardBorder.dark : cfg.cardBorder.light,
        chipBg:     isDark ? cfg.chipBg.dark     : cfg.chipBg.light,
        chipColor:  isDark ? cfg.chipColor.dark  : cfg.chipColor.light,
        label: L?.[cfg.labelKey] ?? cfg.labelKey,
        Icon: cfg.Icon,
    };
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d)) return v;
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
};

const fmtAmount = (v, currency = '') =>
    v != null
        ? Number(v).toLocaleString('uk-UA', { minimumFractionDigits: 2 }) + ' ' + currency
        : '—';

// ─── OrderCard ─────────────────────────────────────────────────────────────────

const OrderCard = memo(({ order, isDark, L, onDetails }) => {
    const cfg = getStatusCfg(order.orderStatus, isDark, L);
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
                    icon={<cfg.Icon sx={{ fontSize: '0.9rem !important' }} />}
                    label={cfg.label}
                    size="small"
                    sx={{ bgcolor: cfg.chipBg, color: cfg.chipColor, fontWeight: 600, fontSize: '0.78rem', minWidth: 120 }}
                />
            </Box>

            {/* Main info */}
            <Box>
                <Typography fontWeight={700} sx={{ fontSize: '0.95rem', mb: 0.2 }}>
                    {order.orderNumber}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, mb: 0.1 }}>
                    {order.deviceModel}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: subtle }}>
                    {L.DEVICE_TYPE_PREFIX}: {order.deviceType} &nbsp;|&nbsp; {L.PRODUCER_PREFIX}: {order.producer}
                </Typography>
            </Box>

            {/* Date + amount */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.7 }}>
                <Typography sx={{ fontSize: '0.77rem', color: subtle }}>
                    {L.CREATED_PREFIX}: {formatDate(order.orderCreationTime)}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, mt: 0.3 }}>
                    {L.AMOUNT_PREFIX}: {fmtAmount(order.orderEstimatedPrice, L.CURRENCY)}
                </Typography>
            </Box>

            {/* Problem */}
            {order.problemDescription && (
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.7 }}>
                    <Typography
                        sx={{ fontSize: '0.77rem', color: subtle, display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                        {order.problemDescription}
                    </Typography>
                </Box>
            )}

            {/* Action */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.3 }}>
                <Button variant="contained" size="small" endIcon={<ArrowForwardIcon />} onClick={onDetails}>
                    {L.DETAILS_BUTTON}
                </Button>
            </Box>
        </Paper>
    );
});

// ─── ArchivedRepairOrdersPage ──────────────────────────────────────────────────

const STATUS_ORDER_MAP = { 'виконано': 0, 'відмовлено': 1 };

const ArchivedRepairOrdersPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { labels } = useLanguage();
    const L = labels.repairs;
    const AR = L.ARCHIVE;
    const isDark = theme.palette.mode === 'dark';

    // ── Toolbar state ──
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode]       = useState('DATE_DESC');
    const [filterOpen, setFilterOpen]   = useState(false);

    // ── Filter state ──
    const [selectedStatuses, setSelectedStatuses]         = useState(new Set());
    const [selectedDeviceTypes, setSelectedDeviceTypes]   = useState(new Set());
    const [selectedProducers, setSelectedProducers]       = useState(new Set());
    const [amountMin, setAmountMin]                       = useState('');
    const [amountMax, setAmountMax]                       = useState('');
    const [dateFrom, setDateFrom]                         = useState(null);
    const [dateTo, setDateTo]                             = useState(null);

    // ── Infinite scroll ──
    const BATCH = 12;
    const [displayCount, setDisplayCount] = useState(BATCH);
    const observerRef = useRef(null);

    const sentinelRef = useCallback((node) => {
        if (observerRef.current) observerRef.current.disconnect();
        if (!node) return;
        observerRef.current = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setDisplayCount((p) => p + BATCH); },
            { rootMargin: '400px' }
        );
        observerRef.current.observe(node);
    }, []);

    // ── Data state ──
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchArchivedOrders();
            setOrders(data);
        } catch {
            setError(AR.LOAD_FAILED);
        } finally {
            setLoading(false);
        }
    }, [AR.LOAD_FAILED]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    // ── Derived filter option lists ──
    const availableStatuses = useMemo(
        () => [...new Set(orders.map((o) => o.orderStatus).filter(Boolean))].sort(),
        [orders]
    );
    const availableDeviceTypes = useMemo(
        () => [...new Set(orders.map((o) => o.deviceType).filter(Boolean))].sort(),
        [orders]
    );
    const availableProducers = useMemo(
        () => [...new Set(orders.map((o) => o.producer).filter(Boolean))].sort(),
        [orders]
    );
    const amountRange = useMemo(() => {
        const amounts = orders.filter((o) => o.orderEstimatedPrice != null).map((o) => o.orderEstimatedPrice);
        return amounts.length > 0
            ? [Math.floor(Math.min(...amounts)), Math.ceil(Math.max(...amounts))]
            : [0, 100000];
    }, [orders]);
    const dateRange = useMemo(() => {
        const ts = orders.filter((o) => o.orderCreationTime).map((o) => dayjs(o.orderCreationTime).valueOf());
        return ts.length > 0
            ? [Math.min(...ts), Math.max(...ts)]
            : [dayjs().subtract(90, 'day').startOf('day').valueOf(), dayjs().endOf('day').valueOf()];
    }, [orders]);

    // Slider display values
    const sliderMin = amountMin !== '' ? parseFloat(amountMin) : amountRange[0];
    const sliderMax = amountMax !== '' ? parseFloat(amountMax) : amountRange[1];
    const dateSliderFrom = dateFrom ? dateFrom.startOf('day').valueOf() : dateRange[0];
    const dateSliderTo   = dateTo   ? dateTo.endOf('day').valueOf()     : dateRange[1];

    // ── Active filter count ──
    const activeFilterCount =
        selectedStatuses.size +
        selectedDeviceTypes.size +
        selectedProducers.size +
        (amountMin !== '' ? 1 : 0) +
        (amountMax !== '' ? 1 : 0) +
        (dateFrom != null ? 1 : 0) +
        (dateTo != null ? 1 : 0);

    const clearFilters = () => {
        setSelectedStatuses(new Set());
        setSelectedDeviceTypes(new Set());
        setSelectedProducers(new Set());
        setAmountMin('');
        setAmountMax('');
        setDateFrom(null);
        setDateTo(null);
    };

    // ── Filtering + sorting ──
    const visibleOrders = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return orders
            .filter((o) => {
                if (q) {
                    const hit =
                        (o.orderNumber ?? '').toLowerCase().includes(q) ||
                        (o.deviceModel ?? '').toLowerCase().includes(q) ||
                        (o.producer ?? '').toLowerCase().includes(q) ||
                        (o.problemDescription ?? '').toLowerCase().includes(q);
                    if (!hit) return false;
                }
                if (selectedStatuses.size > 0 && !selectedStatuses.has(o.orderStatus)) return false;
                if (selectedDeviceTypes.size > 0 && !selectedDeviceTypes.has(o.deviceType)) return false;
                if (selectedProducers.size > 0 && !selectedProducers.has(o.producer)) return false;
                if (amountMin !== '' && (o.orderEstimatedPrice == null || o.orderEstimatedPrice < parseFloat(amountMin))) return false;
                if (amountMax !== '' && (o.orderEstimatedPrice == null || o.orderEstimatedPrice > parseFloat(amountMax))) return false;
                if (dateFrom && o.orderCreationTime && dayjs(o.orderCreationTime).valueOf() < dateFrom.startOf('day').valueOf()) return false;
                if (dateTo   && o.orderCreationTime && dayjs(o.orderCreationTime).valueOf() > dateTo.endOf('day').valueOf())     return false;
                return true;
            })
            .sort((a, b) => {
                switch (sortMode) {
                    case 'DATE_DESC':    return new Date(b.orderCreationTime || 0) - new Date(a.orderCreationTime || 0);
                    case 'DATE_ASC':     return new Date(a.orderCreationTime || 0) - new Date(b.orderCreationTime || 0);
                    case 'AMOUNT_DESC':  return (b.orderEstimatedPrice ?? -1) - (a.orderEstimatedPrice ?? -1);
                    case 'AMOUNT_ASC':   return (a.orderEstimatedPrice ?? Infinity) - (b.orderEstimatedPrice ?? Infinity);
                    case 'STATUS':       return (STATUS_ORDER_MAP[a.orderStatus] ?? 0) - (STATUS_ORDER_MAP[b.orderStatus] ?? 0);
                    default: return 0;
                }
            });
    }, [orders, searchQuery, sortMode, selectedStatuses, selectedDeviceTypes, selectedProducers, amountMin, amountMax, dateFrom, dateTo]);

    // Reset display count on filter/search/sort change
    useEffect(() => { setDisplayCount(BATCH); }, [searchQuery, sortMode, selectedStatuses, selectedDeviceTypes, selectedProducers, amountMin, amountMax, dateFrom, dateTo]);

    return (
        <Box sx={{ width: '100%' }}>
            <Typography component="h1" variant="h4" fontWeight={600} sx={pageTitleSx}>
                {AR.PAGE_TITLE}
            </Typography>

            {/* ── Toolbar ── */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: filterOpen ? 1.5 : 2.5,
                flexWrap: 'wrap',
            }}>
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

                <Tooltip title={L.FILTER.TITLE}>
                    <IconButton
                        onClick={() => setFilterOpen((p) => !p)}
                        sx={filterToggleButtonSx(filterOpen)}
                    >
                        <Badge badgeContent={activeFilterCount} color="primary" max={9} invisible={activeFilterCount === 0}>
                            <FilterListIcon color="primary" />
                        </Badge>
                    </IconButton>
                </Tooltip>

                <FormControl size="small" sx={{ minWidth: 220, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <InputLabel id="archive-repair-sort-label">{L.SORT_LABEL}</InputLabel>
                    <Select
                        labelId="archive-repair-sort-label"
                        label={L.SORT_LABEL}
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                    >
                        <MenuItem value="DATE_DESC">{L.SORT_OPTIONS.DATE_DESC}</MenuItem>
                        <MenuItem value="DATE_ASC">{L.SORT_OPTIONS.DATE_ASC}</MenuItem>
                        <MenuItem value="AMOUNT_DESC">{L.SORT_OPTIONS.AMOUNT_DESC}</MenuItem>
                        <MenuItem value="AMOUNT_ASC">{L.SORT_OPTIONS.AMOUNT_ASC}</MenuItem>
                        <MenuItem value="STATUS">{L.SORT_OPTIONS.STATUS}</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* ── Filter panel ── */}
            <ActiveOrdersFilters
                filterOpen={filterOpen}
                L={L}
                availableDeviceTypes={availableDeviceTypes}
                selectedDeviceTypes={selectedDeviceTypes}
                setSelectedDeviceTypes={setSelectedDeviceTypes}
                availableProducers={availableProducers}
                selectedProducers={selectedProducers}
                setSelectedProducers={setSelectedProducers}
                availableStatuses={availableStatuses}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                sliderMin={sliderMin}
                sliderMax={sliderMax}
                amountRange={amountRange}
                setAmountMin={setAmountMin}
                setAmountMax={setAmountMax}
                amountMin={amountMin}
                amountMax={amountMax}
                dateSliderFrom={dateSliderFrom}
                dateSliderTo={dateSliderTo}
                dateRange={dateRange}
                setDateFrom={setDateFrom}
                setDateTo={setDateTo}
                dateFrom={dateFrom}
                dateTo={dateTo}
                activeFilterCount={activeFilterCount}
                clearFilters={clearFilters}
            />

            {/* ── States ── */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
                    <CircularProgress />
                </Box>
            )}
            {!loading && error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {!loading && !error && visibleOrders.length === 0 && (
                <Paper sx={{ p: 3, bgcolor: 'background.paper', border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                    <Typography color="text.secondary">{AR.NO_RESULTS}</Typography>
                </Paper>
            )}

            {/* ── Cards grid ── */}
            {!loading && !error && visibleOrders.length > 0 && (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(260px, 1fr))', xl: 'repeat(3, minmax(260px, 1fr))' },
                    gap: 2,
                }}>
                    {visibleOrders.slice(0, displayCount).map((order, idx) => (
                        <Fade in appear timeout={Math.min(300 + (idx % BATCH) * 60, 800)} key={order.orderNumber}>
                            <Box>
                                <OrderCard
                                    order={order}
                                    isDark={isDark}
                                    L={AR}
                                    onDetails={() => navigate(`/repairs/${order.orderNumber}`)}
                                />
                            </Box>
                        </Fade>
                    ))}
                </Box>
            )}

            {/* ── Infinite scroll sentinel ── */}
            {!loading && !error && displayCount < visibleOrders.length && (
                <Box ref={sentinelRef} sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={28} />
                </Box>
            )}
        </Box>
    );
};

export default ArchivedRepairOrdersPage;
