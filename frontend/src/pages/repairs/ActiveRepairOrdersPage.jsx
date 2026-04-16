import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Tooltip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Badge,
    Tabs,
    Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import { useLanguage } from '../../app/i18n/LanguageContext';
import { useAuth } from '../../app/auth/AuthContext';
import { APP_ROLES, normalizeRole } from '../../app/auth/roleUtils';
import { fetchActiveOrders, fetchAvailableOrders, fetchMyOrders } from '../../services/ordersService';
import OrderCard from './components/OrderCard';
import ActiveOrdersFilters from './components/ActiveOrdersFilters';
import CreateOrderModal from './components/CreateOrderModal';
import {
    pageTitleSx,
    toolbarSx,
    searchFieldSx,
    filterToggleButtonSx,
    sortControlSx,
    masterTabsContainerSx,
    masterTabSx,
    toolbarSpacerSx,
    createOrderButtonSx,
    loadingBoxSx,
    errorAlertSx,
    emptyStateSx,
    ordersGridSx,
} from './ActiveRepairOrdersPage.styles';

/**
 * Canonical order of statuses for status-based sorting.
 * Reflects the typical repair workflow progression.
 */
const STATUS_ORDER = ['NEW', 'DIAGNOSTICS', 'AWAITING_CONFIRMATION', 'AWAITING_REPAIR', 'IN_REPAIR', 'READY_FOR_PICKUP'];


const ActiveRepairOrdersPage = () => {
    const { labels, lang } = useLanguage();
    const { user } = useAuth();
    const L = labels.repairs;
    const normalizedRole = normalizeRole(user?.role);
    const isMaster = normalizedRole === APP_ROLES.MASTER;

    // ── Toolbar state ──
    const [searchQuery, setSearchQuery] = useState('');
    /** Sort mode: 'STATUS' | 'STATUS_REV' | 'DATE_DESC' | 'DATE_ASC' | 'DEVICE_TYPE' | 'AMOUNT_DESC' | 'AMOUNT_ASC' */
    const [sortMode, setSortMode] = useState('DATE_DESC');
    const [filterOpen, setFilterOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [masterTab, setMasterTab] = useState('AVAILABLE');

    // ── Filter state ──
    const [selectedStatuses, setSelectedStatuses] = useState(new Set());
    const [selectedDeviceTypes, setSelectedDeviceTypes] = useState(new Set());
    const [selectedProducers, setSelectedProducers] = useState(new Set());
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    /** dayjs | null — null means "no filter" */
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);

    // ── Data state — active orders (/orders/active), used for non-masters and master's IN_PROGRESS tab ──
    const [orders, setOrders] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // ── Data state — available orders for master (/orders/available), used for master's AVAILABLE tab ──
    const [availableOrders, setAvailableOrders] = useState([]);
    const [loadingAvailable, setLoadingAvailable] = useState(isMaster);
    const [fetchAvailableError, setFetchAvailableError] = useState(null);

    // ── Data state — master's own orders (/orders/my), used for master's IN_PROGRESS tab ──
    const [myOrders, setMyOrders] = useState([]);
    const [loadingMy, setLoadingMy] = useState(isMaster);
    const [fetchMyError, setFetchMyError] = useState(null);

    const loadOrders = useCallback(async () => {
        setLoadingData(true);
        setFetchError(null);
        try {
            const data = await fetchActiveOrders();
            setOrders(data);
        } catch (err) {
            setFetchError(
                err.response?.data?.error || err.message || 'Помилка завантаження замовлень'
            );
        } finally {
            setLoadingData(false);
        }
    }, []);

    const loadAvailableOrders = useCallback(async () => {
        setLoadingAvailable(true);
        setFetchAvailableError(null);
        try {
            const data = await fetchAvailableOrders();
            setAvailableOrders(data);
        } catch (err) {
            setFetchAvailableError(
                err.response?.data?.error || err.message || 'Помилка завантаження доступних замовлень'
            );
        } finally {
            setLoadingAvailable(false);
        }
    }, []);

    const loadMyOrders = useCallback(async () => {
        setLoadingMy(true);
        setFetchMyError(null);
        try {
            const data = await fetchMyOrders();
            setMyOrders(data);
        } catch (err) {
            setFetchMyError(
                err.response?.data?.error || err.message || 'Помилка завантаження замовлень у роботі'
            );
        } finally {
            setLoadingMy(false);
        }
    }, []);

    useEffect(() => {
        if (isMaster) {
            loadAvailableOrders();
            loadMyOrders();
        } else {
            loadOrders();
        }
    }, [isMaster, loadOrders, loadAvailableOrders, loadMyOrders]);

    // ── Source dataset switches with the active tab ──
    const filterSourceOrders = useMemo(() => {
        if (!isMaster) return orders;
        return masterTab === 'AVAILABLE' ? availableOrders : myOrders;
    }, [isMaster, masterTab, orders, availableOrders, myOrders]);

    // ── Derived filter option lists (from the currently visible dataset) ──
    const availableStatuses = useMemo(
        () => [...new Set(filterSourceOrders.map((o) => o.statusLabel))].filter(Boolean).sort(),
        [filterSourceOrders]
    );
    const availableDeviceTypes = useMemo(
        () => [...new Set(filterSourceOrders.map((o) => o.deviceType))].filter(Boolean).sort(),
        [filterSourceOrders]
    );
    const availableProducers = useMemo(
        () => [...new Set(filterSourceOrders.map((o) => o.producer))].filter(Boolean).sort(),
        [filterSourceOrders]
    );
    /** [min, max] amount range across the currently visible dataset. */
    const amountRange = useMemo(() => {
        const amounts = filterSourceOrders.filter((o) => o.amount != null).map((o) => o.amount);
        return amounts.length > 0
            ? [Math.floor(Math.min(...amounts)), Math.ceil(Math.max(...amounts))]
            : [0, 100000];
    }, [filterSourceOrders]);

    /** Number of active filter criteria (shown as badge on filter button). */
    const activeFilterCount =
        selectedStatuses.size +
        selectedDeviceTypes.size +
        selectedProducers.size +
        (amountMin !== '' ? 1 : 0) +
        (amountMax !== '' ? 1 : 0) +
        (dateFrom != null ? 1 : 0) +
        (dateTo != null ? 1 : 0);

    /** Reset all filter criteria to their defaults. */
    const clearFilters = () => {
        setSelectedStatuses(new Set());
        setSelectedDeviceTypes(new Set());
        setSelectedProducers(new Set());
        setAmountMin('');
        setAmountMax('');
        setDateFrom(null);
        setDateTo(null);
    };

    const openCreateModal = () => setCreateModalOpen(true);
    const closeCreateModal = () => setCreateModalOpen(false);

    // Slider display values — fall back to full range when text fields are empty
    const sliderMin = amountMin !== '' ? parseFloat(amountMin) : amountRange[0];
    const sliderMax = amountMax !== '' ? parseFloat(amountMax) : amountRange[1];

    /** [minTs, maxTs] timestamp range for the date slider derived from the currently visible dataset. */
    const dateRange = useMemo(() => {
        const timestamps = filterSourceOrders
            .filter((o) => o.createdAtRaw)
            .map((o) => dayjs(o.createdAtRaw).valueOf());
        if (timestamps.length === 0) {
            // Default: last 90 days
            return [dayjs().subtract(90, 'day').startOf('day').valueOf(), dayjs().endOf('day').valueOf()];
        }
        return [Math.min(...timestamps), Math.max(...timestamps)];
    }, [filterSourceOrders]);

    // Slider value (timestamps)
    const dateSliderFrom = dateFrom ? dateFrom.startOf('day').valueOf() : dateRange[0];
    const dateSliderTo   = dateTo   ? dateTo.endOf('day').valueOf()     : dateRange[1];

    /**
     * Applies search query + all active filters + sort to the given order list.
     * Memoized so both filteredOrders and filteredAvailableOrders share the same logic
     * without duplication.
     */
    const applyFiltersAndSort = useCallback((list) => {
        const q = searchQuery.toLowerCase();

        return list
            .filter((o) => {
                // ── Text search ──
                const matchesSearch =
                    o.id.toLowerCase().includes(q) ||
                    o.deviceInfo.toLowerCase().includes(q) ||
                    o.serialNumber.toLowerCase().includes(q) ||
                    o.description.toLowerCase().includes(q);
                if (!matchesSearch) return false;

                // ── Filter: status ──
                if (selectedStatuses.size > 0 && !selectedStatuses.has(o.statusLabel)) return false;

                // ── Filter: device type ──
                if (selectedDeviceTypes.size > 0 && !selectedDeviceTypes.has(o.deviceType)) return false;

                // ── Filter: producer ──
                if (selectedProducers.size > 0 && !selectedProducers.has(o.producer)) return false;

                // ── Filter: amount range ──
                if (amountMin !== '' && (o.amount == null || o.amount < parseFloat(amountMin))) return false;
                if (amountMax !== '' && (o.amount == null || o.amount > parseFloat(amountMax))) return false;

                // ── Filter: date range ──
                if (dateFrom && o.createdAtRaw && dayjs(o.createdAtRaw).valueOf() < dateFrom.startOf('day').valueOf()) return false;
                if (dateTo   && o.createdAtRaw && dayjs(o.createdAtRaw).valueOf() > dateTo.endOf('day').valueOf())     return false;

                return true;
            })
            .sort((a, b) => {
                switch (sortMode) {
                    case 'STATUS':
                        return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
                    case 'STATUS_REV':
                        return STATUS_ORDER.indexOf(b.status) - STATUS_ORDER.indexOf(a.status);
                    case 'DATE_ASC':
                        return new Date(a.createdAtRaw || 0) - new Date(b.createdAtRaw || 0);
                    case 'DATE_DESC':
                        return new Date(b.createdAtRaw || 0) - new Date(a.createdAtRaw || 0);
                    case 'DEVICE_TYPE':
                        return a.deviceInfo.localeCompare(b.deviceInfo, 'uk');
                    case 'AMOUNT_DESC':
                        if (a.amount == null && b.amount == null) return 0;
                        if (a.amount == null) return 1;
                        if (b.amount == null) return -1;
                        return b.amount - a.amount;
                    case 'AMOUNT_ASC':
                        if (a.amount == null && b.amount == null) return 0;
                        if (a.amount == null) return 1;
                        if (b.amount == null) return -1;
                        return a.amount - b.amount;
                    default:
                        return 0;
                }
            });
    }, [searchQuery, sortMode, selectedStatuses, selectedDeviceTypes, selectedProducers, amountMin, amountMax, dateFrom, dateTo]);

    /** Active orders after search + filter + sort — used for non-masters and master's IN_PROGRESS tab. */
    const filteredOrders = useMemo(
        () => applyFiltersAndSort(orders),
        [orders, applyFiltersAndSort]
    );

    /** Available orders after search + filter + sort — used for master's AVAILABLE tab. */
    const filteredAvailableOrders = useMemo(
        () => applyFiltersAndSort(availableOrders),
        [availableOrders, applyFiltersAndSort]
    );

    /** Master's own orders after search + filter + sort — used for master's IN_PROGRESS tab. */
    const filteredMyOrders = useMemo(
        () => applyFiltersAndSort(myOrders),
        [myOrders, applyFiltersAndSort]
    );

    const visibleOrders = useMemo(() => {
        if (!isMaster) return filteredOrders;
        return masterTab === 'AVAILABLE' ? filteredAvailableOrders : filteredMyOrders;
    }, [filteredOrders, filteredAvailableOrders, filteredMyOrders, isMaster, masterTab]);

    // Loading / error state reflect the currently active tab
    const isLoading = isMaster
        ? (masterTab === 'AVAILABLE' ? loadingAvailable : loadingMy)
        : loadingData;
    const displayError = isMaster
        ? (masterTab === 'AVAILABLE' ? fetchAvailableError : fetchMyError)
        : fetchError;

    return (
        <Box>
            {/* ── Page title ── */}
            <Typography
                component="h1"
                variant="h4"
                fontWeight={600}
                sx={pageTitleSx}
            >
                {L.PAGE_TITLE}
            </Typography>

            {/* ── Toolbar: Search + Filter + Sort + Create ── */}
            <Box sx={toolbarSx(filterOpen)}>
                {/* Search */}
                <TextField
                    size="small"
                    placeholder={L.SEARCH_PLACEHOLDER}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={searchFieldSx}
                />

                {/* Filter toggle button — badge shows count of active criteria */}
                <Tooltip title={L.FILTER.TITLE}>
                    <IconButton
                        id="filter-toggle-btn"
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

                {/* Sort dropdown */}
                <FormControl size="small" sx={sortControlSx}>
                    <InputLabel id="sort-select-label">{L.SORT_LABEL}</InputLabel>
                    <Select
                        labelId="sort-select-label"
                        id="sort-select"
                        value={sortMode}
                        label={L.SORT_LABEL}
                        onChange={(e) => setSortMode(e.target.value)}
                    >
                        <MenuItem value="STATUS">{L.SORT_OPTIONS.STATUS}</MenuItem>
                        <MenuItem value="STATUS_REV">{L.SORT_OPTIONS.STATUS_REV}</MenuItem>
                        <MenuItem value="DATE_DESC">{L.SORT_OPTIONS.DATE_DESC}</MenuItem>
                        <MenuItem value="DATE_ASC">{L.SORT_OPTIONS.DATE_ASC}</MenuItem>
                        <MenuItem value="DEVICE_TYPE">{L.SORT_OPTIONS.DEVICE_TYPE}</MenuItem>
                        <MenuItem value="AMOUNT_DESC">{L.SORT_OPTIONS.AMOUNT_DESC}</MenuItem>
                        <MenuItem value="AMOUNT_ASC">{L.SORT_OPTIONS.AMOUNT_ASC}</MenuItem>
                    </Select>
                </FormControl>

                {/* Spacer */}
                <Box sx={toolbarSpacerSx} />

                {/* Create order is unavailable for masters */}
                {!isMaster && (
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={openCreateModal}
                        sx={createOrderButtonSx}
                    >
                        {L.CREATE_ORDER_BUTTON}
                    </Button>
                )}
            </Box>

            {isMaster && (
                <Tabs
                    value={masterTab}
                    onChange={(_, value) => setMasterTab(value)}
                    sx={masterTabsContainerSx}
                >
                    <Tab value="AVAILABLE" label={L.MASTER_TABS.AVAILABLE} sx={masterTabSx} />
                    <Tab value="IN_PROGRESS" label={L.MASTER_TABS.IN_PROGRESS} sx={masterTabSx} />
                </Tabs>
            )}

            {!isMaster && (
                <CreateOrderModal
                    open={createModalOpen}
                    onClose={closeCreateModal}
                    labels={L.CREATE_MODAL}
                    lang={lang}
                    onOrderCreated={loadOrders}
                />
            )}

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

            {/* ── Loading / Error / Orders grid ── */}
            {isLoading ? (
                <Box sx={loadingBoxSx}>
                    <CircularProgress />
                </Box>
            ) : displayError ? (
                <Alert severity="error" sx={errorAlertSx}>
                    {displayError}
                </Alert>
            ) : visibleOrders.length === 0 ? (
                <Box sx={emptyStateSx}>
                    <Typography variant="h6" color="text.secondary">
                        {L.NO_RESULTS}
                    </Typography>
                </Box>
            ) : (
                <Box sx={ordersGridSx}>
                    {visibleOrders.map((order) => (
                        <OrderCard key={order.id} order={order} labels={L} />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default ActiveRepairOrdersPage;
