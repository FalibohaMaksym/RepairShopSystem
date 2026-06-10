import React, { useEffect, useState } from 'react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    TextField,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    confirmOrderRepairs,
    declineOrderRepair,
    fetchAllOrderServices,
    fetchRepairPriorities,
} from '../../../services/ordersService';
import {
    fetchComponentCategories,
    fetchComponentPriceRange,
    fetchComponentProducers,
    fetchComponents,
} from '../../../services/componentsService';

const fmtPrice = (v) =>
    Number(v).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const panelSx = {
    p: { xs: 1.8, md: 2.2 },
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.15)' : '#C8D8E7',
    border: '1px solid',
    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.4)' : '#b2c5d6',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.16)',
};

const listWrapSx = {
    mt: 1.2,
    p: 1.2,
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.62)',
    border: '1px solid',
    borderColor: 'rgba(60,80,100,0.34)',
};

const priorityRowSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr auto auto', md: 'auto 1fr auto' },
    alignItems: 'center',
    gap: 1,
};

const actionRowSx = {
    mt: 2,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 1,
    flexWrap: 'wrap',
};

let nextLocalId = 1;
const makeLocalId = () => {
    const id = nextLocalId;
    nextLocalId += 1;
    return id;
};

const makeEmptyRepair = (firstPriorityId) => ({
    localId: makeLocalId(),
    priorityId: firstPriorityId ?? null,
    services: [],
});

const makeEmptyService = (firstServiceId) => ({
    localId: makeLocalId(),
    serviceId: firstServiceId ?? null,
    components: [],
    componentsPanelOpen: false,
});

/**
 * Panel for ADMIN / SENIOR_ADMIN at the AWAITING_CONFIRMATION stage.
 * Lets the user plan one or more repairs (each with a priority and optional services)
 * and either confirm or decline the repair execution.
 *
 * Props:
 *   labels             — ORDER_DETAILS section of the i18n labels object
 *   orderNumber        — current order number string
 *   onRepairsConfirmed — callback fired after a successful POST /repair
 *   onRepairDeclined   — callback fired after a successful PATCH /decline
 */
const AdminRepairPlanningPanel = ({ labels, orderNumber, onRepairsConfirmed, onRepairDeclined }) => {
    const [isPlanningOpen, setIsPlanningOpen] = useState(false);

    const [priorities, setPriorities] = useState([]);
    const [loadingPriorities, setLoadingPriorities] = useState(true);

    const [availableServices, setAvailableServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);

    // List item shape: { localId, priorityId, services: [{ localId, serviceId, components, componentsPanelOpen }] }
    const [plannedRepairs, setPlannedRepairs] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbarState, setSnackbarState] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    // ── Component catalog shared state ────────────────────────────────────────
    const [componentCategories, setComponentCategories] = useState([]);
    const [componentProducers, setComponentProducers] = useState([]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 20000, loaded: false });
    const [catalogFilters, setCatalogFilters] = useState({
        search: '', categoryId: '', producer: null,
        priceMin: 0, priceMax: 20000, sliderValue: [0, 20000],
    });
    const [catalogComponents, setCatalogComponents] = useState([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [catalogSearchDone, setCatalogSearchDone] = useState(false);
    const [catalogQty, setCatalogQty] = useState({});

    // ── Load priorities ───────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        setLoadingPriorities(true);
        fetchRepairPriorities()
            .then((data) => {
                if (cancelled) return;
                setPriorities(data);
                if (data.length > 0) {
                    setPlannedRepairs((prev) =>
                        prev.length > 0 ? prev : [makeEmptyRepair(data[0].id)]
                    );
                }
            })
            .catch(() => {
                if (!cancelled) showSnackbar(labels.REPAIR_PLAN_PRIORITIES_LOAD_FAILED, 'error');
            })
            .finally(() => {
                if (!cancelled) setLoadingPriorities(false);
            });

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Load all services for the order's device type ──────────────────────────
    useEffect(() => {
        if (!orderNumber) return;
        let cancelled = false;

        setLoadingServices(true);
        fetchAllOrderServices(orderNumber)
            .then((data) => {
                if (!cancelled) setAvailableServices(data);
            })
            .catch(() => {
                if (!cancelled) showSnackbar(labels.REPAIR_PLAN_SERVICES_LOAD_FAILED, 'warning');
            })
            .finally(() => {
                if (!cancelled) setLoadingServices(false);
            });

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderNumber]);

    // ── Load component catalog metadata (categories, producers, price range) ──
    useEffect(() => {
        let cancelled = false;
        Promise.all([fetchComponentCategories(), fetchComponentProducers(), fetchComponentPriceRange()])
            .then(([cats, prods, range]) => {
                if (cancelled) return;
                setComponentCategories(Array.isArray(cats) ? cats.filter((c) => c?.name) : []);
                setComponentProducers(Array.isArray(prods) ? prods.filter((p) => p?.name) : []);
                const mn = Number.isFinite(range?.minPrice) ? range.minPrice : 0;
                const mx = Number.isFinite(range?.maxPrice) ? range.maxPrice : 20000;
                setPriceRange({ min: mn, max: mx, loaded: true });
                setCatalogFilters((f) => ({ ...f, priceMin: mn, priceMax: mx, sliderValue: [mn, mx] }));
            })
            .catch(() => {
                if (!cancelled) setPriceRange({ min: 0, max: 20000, loaded: true });
            });
        return () => { cancelled = true; };
    }, []);

    // ── Snackbar ──────────────────────────────────────────────────────────────
    const showSnackbar = (message, severity = 'success') => {
        setSnackbarState({ open: true, message, severity });
    };

    const closeSnackbar = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarState((prev) => ({ ...prev, open: false }));
    };

    // ── Repair CRUD ───────────────────────────────────────────────────────────
    const addRepair = () => {
        setPlannedRepairs((prev) => [
            ...prev,
            makeEmptyRepair(priorities[0]?.id ?? null),
        ]);
    };

    const removeRepair = (localId) => {
        setPlannedRepairs((prev) => prev.filter((item) => item.localId !== localId));
    };

    const updatePriority = (localId, priorityId) => {
        setPlannedRepairs((prev) =>
            prev.map((item) => (item.localId === localId ? { ...item, priorityId } : item))
        );
    };

    // ── Service CRUD (per repair) ─────────────────────────────────────────────
    const addService = (repairLocalId) => {
        const firstId = availableServices[0]?.serviceId ?? null;
        setPlannedRepairs((prev) =>
            prev.map((r) =>
                r.localId === repairLocalId
                    ? { ...r, services: [...r.services, makeEmptyService(firstId)] }
                    : r
            )
        );
    };

    const removeService = (repairLocalId, serviceLocalId) => {
        setPlannedRepairs((prev) =>
            prev.map((r) =>
                r.localId === repairLocalId
                    ? { ...r, services: r.services.filter((s) => s.localId !== serviceLocalId) }
                    : r
            )
        );
    };

    const updateService = (repairLocalId, serviceLocalId, serviceId) => {
        setPlannedRepairs((prev) =>
            prev.map((r) =>
                r.localId === repairLocalId
                    ? {
                        ...r,
                        services: r.services.map((s) =>
                            s.localId === serviceLocalId ? { ...s, serviceId } : s
                        ),
                    }
                    : r
            )
        );
    };

    const toggleComponentsPanel = (repairLocalId, serviceLocalId) => {
        setPlannedRepairs((prev) =>
            prev.map((r) =>
                r.localId === repairLocalId
                    ? {
                        ...r,
                        services: r.services.map((s) =>
                            s.localId === serviceLocalId
                                ? { ...s, componentsPanelOpen: !s.componentsPanelOpen }
                                : s
                        ),
                    }
                    : r
            )
        );
    };

    const addComponentToService = (repairLocalId, serviceLocalId, component) => {
        const qty = catalogQty[component.id] ?? 1;
        setPlannedRepairs((prev) =>
            prev.map((r) =>
                r.localId === repairLocalId
                    ? {
                        ...r,
                        services: r.services.map((s) => {
                            if (s.localId !== serviceLocalId) return s;
                            if (s.components.some((c) => c.id === component.id)) return s;
                            return { ...s, components: [...s.components, { ...component, quantity: qty }] };
                        }),
                    }
                    : r
            )
        );
    };

    const removeComponentFromService = (repairLocalId, serviceLocalId, componentId) => {
        setPlannedRepairs((prev) =>
            prev.map((r) =>
                r.localId === repairLocalId
                    ? {
                        ...r,
                        services: r.services.map((s) =>
                            s.localId === serviceLocalId
                                ? { ...s, components: s.components.filter((c) => c.id !== componentId) }
                                : s
                        ),
                    }
                    : r
            )
        );
    };

    const updateComponentQty = (repairLocalId, serviceLocalId, componentId, qty) => {
        setPlannedRepairs((prev) =>
            prev.map((r) =>
                r.localId === repairLocalId
                    ? {
                        ...r,
                        services: r.services.map((s) =>
                            s.localId === serviceLocalId
                                ? {
                                    ...s,
                                    components: s.components.map((c) =>
                                        c.id === componentId ? { ...c, quantity: Math.max(1, qty) } : c
                                    ),
                                }
                                : s
                        ),
                    }
                    : r
            )
        );
    };

    // ── Component catalog search ──────────────────────────────────────────────
    const handleCatalogSearch = async () => {
        if (!priceRange.loaded) return;
        setCatalogSearchDone(true);
        setLoadingCatalog(true);
        try {
            const data = await fetchComponents({
                producerId: catalogFilters.producer?.id ?? null,
                categoryId: catalogFilters.categoryId || null,
                minPrice: catalogFilters.priceMin,
                maxPrice: catalogFilters.priceMax,
                search: catalogFilters.search,
            });
            setCatalogComponents(Array.isArray(data) ? data : []);
        } catch {
            setCatalogComponents([]);
        } finally {
            setLoadingCatalog(false);
        }
    };

    // ── Submit / Decline ──────────────────────────────────────────────────────
    const approveRepairs = async () => {
        if (plannedRepairs.length === 0) {
            showSnackbar(labels.REPAIR_PLAN_APPROVE_EMPTY, 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const repairs = plannedRepairs
                .filter((r) => r.priorityId != null)
                .map((r) => ({
                    priorityId: r.priorityId,
                    services: r.services
                        .filter((s) => s.serviceId != null)
                        .map((s) => ({
                            serviceId: s.serviceId,
                            components: (s.components ?? []).map((c) => ({
                                componentId: c.id,
                                quantity: c.quantity ?? 1,
                            })),
                        })),
                }));

            await confirmOrderRepairs(orderNumber, repairs);
            showSnackbar(labels.REPAIR_PLAN_APPROVE_SUCCESS, 'success');
            onRepairsConfirmed?.();
        } catch (err) {
            showSnackbar(
                err.response?.data?.error || labels.REPAIR_PLAN_APPROVE_FAILED,
                'error'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const rejectRepairs = async () => {
        setIsSubmitting(true);
        try {
            await declineOrderRepair(orderNumber);
            showSnackbar(labels.REPAIR_PLAN_REJECT_SUCCESS, 'success');
            onRepairDeclined?.();
        } catch (err) {
            showSnackbar(
                err.response?.data?.error || labels.REPAIR_PLAN_REJECT_FAILED,
                'error'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const openPlanning = () => setIsPlanningOpen(true);
    const closePlanning = () => setIsPlanningOpen(false);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Paper sx={panelSx}>
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 500,
                    mb: 1.2,
                    display: 'inline-flex',
                    px: 0.8,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                {labels.REPAIRS_SECTION_TITLE}
            </Typography>

            {loadingPriorities ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : !isPlanningOpen ? (
                <Box sx={actionRowSx}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        disabled={isSubmitting}
                        onClick={rejectRepairs}
                    >
                        {labels.REPAIR_PLAN_REJECT_BUTTON}
                    </Button>

                    <Button
                        variant="contained"
                        disabled={isSubmitting}
                        onClick={openPlanning}
                    >
                        {labels.REPAIR_PLAN_START_BUTTON}
                    </Button>
                </Box>
            ) : (
                <>
                    <Box sx={listWrapSx}>
                        {plannedRepairs.length === 0 ? (
                            <Typography color="text.secondary">{labels.REPAIR_PLAN_EMPTY}</Typography>
                        ) : (
                            plannedRepairs.map((repair, index) => (
                                <Box
                                    key={repair.localId}
                                    sx={{
                                        mb: 1.5,
                                        p: 1,
                                        border: '1px solid',
                                        borderColor: 'rgba(60,80,100,0.22)',
                                        borderRadius: 1,
                                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.45)',
                                    }}
                                >
                                    {/* Priority row */}
                                    <Box sx={priorityRowSx}>
                                        <Typography sx={{ fontWeight: 600 }}>
                                            {index + 1}.
                                        </Typography>
                                        <Select
                                            size="small"
                                            value={repair.priorityId ?? ''}
                                            onChange={(e) => updatePriority(repair.localId, e.target.value)}
                                            sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#E7EFC6' }}
                                            disabled={isSubmitting}
                                            fullWidth
                                        >
                                            {priorities.map((priority) => (
                                                <MenuItem key={priority.id} value={priority.id}>
                                                    {labels.REPAIR_PLAN_PRIORITY_LABEL}: {priority.value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        <IconButton
                                            onClick={() => removeRepair(repair.localId)}
                                            disabled={isSubmitting}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>

                                    {/* Services for this repair */}
                                    {(repair.services.length > 0 || availableServices.length > 0) && (
                                        <>
                                            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                                            {repair.services.length > 0 && (
                                                <Box sx={{ mb: 0.8 }}>
                                                    {repair.services.map((svc) => {
                                                        const selected = availableServices.find(
                                                            (s) => s.serviceId === svc.serviceId
                                                        );
                                                        // Components already added to this service
                                                        const svcComponentIds = new Set(svc.components.map((c) => c.id));
                                                        // Catalog items not yet added
                                                        const availableCatalog = catalogComponents.filter((c) => !svcComponentIds.has(c.id));

                                                        return (
                                                            <Box
                                                                key={svc.localId}
                                                                sx={{
                                                                    mb: 1,
                                                                    pl: { xs: 0, md: 3.5 },
                                                                }}
                                                            >
                                                                {/* Service select row */}
                                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 0.5 }}>
                                                                    <Select
                                                                        size="small"
                                                                        value={svc.serviceId ?? ''}
                                                                        onChange={(e) =>
                                                                            updateService(repair.localId, svc.localId, e.target.value)
                                                                        }
                                                                        sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#EAF3FA' }}
                                                                        disabled={isSubmitting}
                                                                        displayEmpty
                                                                        fullWidth
                                                                        renderValue={() =>
                                                                            selected
                                                                                ? `${selected.serviceName}${selected.estimatedPrice != null ? ` — ${selected.estimatedPrice} грн.` : ''}`
                                                                                : (labels.REPAIR_PLAN_SERVICE_PLACEHOLDER ?? 'Оберіть послугу')
                                                                        }
                                                                    >
                                                                        {availableServices.map((s) => (
                                                                            <MenuItem key={s.serviceId} value={s.serviceId}>
                                                                                <Box>
                                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                                        {s.serviceName}
                                                                                    </Typography>
                                                                                    {(s.categoryName || s.estimatedPrice != null) && (
                                                                                        <Typography variant="caption" color="text.secondary">
                                                                                            {[s.categoryName, s.estimatedPrice != null ? `${s.estimatedPrice} грн.` : null]
                                                                                                .filter(Boolean)
                                                                                                .join(' · ')}
                                                                                        </Typography>
                                                                                    )}
                                                                                </Box>
                                                                            </MenuItem>
                                                                        ))}
                                                                    </Select>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => toggleComponentsPanel(repair.localId, svc.localId)}
                                                                        title={labels.SERVICE_FORM_COMPONENTS_SECTION ?? 'Комплектуючі'}
                                                                        sx={{
                                                                            border: '1px solid',
                                                                            borderColor: svc.componentsPanelOpen ? 'rgba(184,116,206,0.5)' : 'rgba(0,0,0,0.15)',
                                                                            bgcolor: svc.componentsPanelOpen ? 'rgba(184,116,206,0.08)' : 'transparent',
                                                                        }}
                                                                    >
                                                                        {svc.componentsPanelOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => removeService(repair.localId, svc.localId)}
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>

                                                                {/* Attached components list */}
                                                                {svc.components.length > 0 && (
                                                                    <Box sx={{ mt: 0.5, pl: 1, borderLeft: '2px solid rgba(184,116,206,0.3)' }}>
                                                                        {svc.components.map((comp) => (
                                                                            <Box
                                                                                key={comp.id}
                                                                                sx={{
                                                                                    display: 'grid',
                                                                                    gridTemplateColumns: '1fr auto auto',
                                                                                    alignItems: 'center',
                                                                                    gap: 0.5,
                                                                                    py: 0.3,
                                                                                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                                                                                }}
                                                                            >
                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                    <Typography noWrap sx={{ fontSize: '0.76rem', fontWeight: 500, lineHeight: 1.3 }}>
                                                                                        {[comp.categoryName, comp.producerName, comp.name].filter(Boolean).join(' · ')}
                                                                                    </Typography>
                                                                                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                                                                                        {labels.COMPONENT_PRICE_LABEL ?? 'Ціна'}: {fmtPrice(comp.price)}
                                                                                    </Typography>
                                                                                </Box>
                                                                                <TextField
                                                                                    size="small"
                                                                                    type="number"
                                                                                    value={comp.quantity}
                                                                                    onChange={(e) => updateComponentQty(repair.localId, svc.localId, comp.id, Number(e.target.value))}
                                                                                    slotProps={{ htmlInput: { min: 1, style: { width: 40, textAlign: 'center', padding: '2px 4px' } } }}
                                                                                    sx={{ '& .MuiInputBase-root': { fontSize: '0.76rem' } }}
                                                                                />
                                                                                <IconButton size="small" onClick={() => removeComponentFromService(repair.localId, svc.localId, comp.id)}>
                                                                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                                                                </IconButton>
                                                                            </Box>
                                                                        ))}
                                                                    </Box>
                                                                )}

                                                                {/* Inline catalog for this service (collapsible) */}
                                                                <Collapse in={svc.componentsPanelOpen}>
                                                                    <Box sx={{ mt: 0.8, p: 1, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(236,243,250,0.8)', border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', borderRadius: 1 }}>
                                                                        <Box
                                                                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, cursor: 'pointer' }}
                                                                            onClick={() => toggleComponentsPanel(repair.localId, svc.localId)}
                                                                        >
                                                                            <Typography variant="caption" fontWeight={700}>
                                                                                {labels.SERVICE_FORM_ADD_COMPONENT_SECTION ?? 'Додавання комплектуючої'}
                                                                            </Typography>
                                                                            <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                                        </Box>

                                                                        {/* Filters */}
                                                                        <Box sx={{ mb: 0.8 }}>
                                                                            <TextField
                                                                                fullWidth size="small"
                                                                                placeholder={labels.SERVICE_FORM_SEARCH_COMPONENT ?? 'Пошук комплектуючої'}
                                                                                value={catalogFilters.search}
                                                                                onChange={(e) => setCatalogFilters((f) => ({ ...f, search: e.target.value }))}
                                                                                slotProps={{ input: { endAdornment: <InputAdornment position="end"><SearchIcon fontSize="small" /></InputAdornment> } }}
                                                                                sx={{ mb: 0.7, bgcolor: 'background.paper' }}
                                                                            />
                                                                            <Box sx={{ display: 'flex', gap: 0.5, mb: 0.7 }}>
                                                                                <Select
                                                                                    size="small" displayEmpty fullWidth
                                                                                    value={catalogFilters.categoryId}
                                                                                    onChange={(e) => setCatalogFilters((f) => ({ ...f, categoryId: e.target.value === '' ? '' : Number(e.target.value) }))}
                                                                                    renderValue={(v) => {
                                                                                        if (v === '') return labels.SERVICE_FORM_COMPONENT_CATEGORY ?? 'Категорія';
                                                                                        return componentCategories.find((c) => c.id === v)?.name ?? labels.SERVICE_FORM_COMPONENT_CATEGORY;
                                                                                    }}
                                                                                    sx={{ bgcolor: 'background.paper', fontSize: '0.82rem' }}
                                                                                >
                                                                                    <MenuItem value=""><em>—</em></MenuItem>
                                                                                    {componentCategories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                                                                </Select>
                                                                                <Autocomplete
                                                                                    size="small" fullWidth
                                                                                    options={componentProducers}
                                                                                    value={catalogFilters.producer}
                                                                                    onChange={(_, v) => setCatalogFilters((f) => ({ ...f, producer: v }))}
                                                                                    isOptionEqualToValue={(o, v) => o.id === v?.id}
                                                                                    getOptionLabel={(o) => o?.name ?? ''}
                                                                                    renderInput={(params) => <TextField {...params} placeholder={labels.SERVICE_FORM_PRODUCER ?? 'Виробник'} />}
                                                                                    sx={{ bgcolor: 'background.paper' }}
                                                                                />
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.7 }}>
                                                                                <TextField
                                                                                    size="small" type="number" value={catalogFilters.priceMin}
                                                                                    onChange={(e) => {
                                                                                        const v = Math.min(Number(e.target.value), catalogFilters.priceMax);
                                                                                        setCatalogFilters((f) => ({ ...f, priceMin: v, sliderValue: [v, f.priceMax] }));
                                                                                    }}
                                                                                    slotProps={{ htmlInput: { style: { padding: '4px 8px' } } }}
                                                                                    sx={{ flex: 1, bgcolor: 'background.paper' }}
                                                                                />
                                                                                <Typography variant="body2" color="text.disabled">—</Typography>
                                                                                <TextField
                                                                                    size="small" type="number" value={catalogFilters.priceMax}
                                                                                    onChange={(e) => {
                                                                                        const v = Math.max(Number(e.target.value), catalogFilters.priceMin);
                                                                                        setCatalogFilters((f) => ({ ...f, priceMax: v, sliderValue: [f.priceMin, v] }));
                                                                                    }}
                                                                                    slotProps={{ htmlInput: { style: { padding: '4px 8px' } } }}
                                                                                    sx={{ flex: 1, bgcolor: 'background.paper' }}
                                                                                />
                                                                            </Box>
                                                                            <Button
                                                                                fullWidth size="small" variant="contained"
                                                                                onClick={handleCatalogSearch}
                                                                                disabled={!priceRange.loaded || loadingCatalog}
                                                                                sx={{ fontSize: '0.78rem', bgcolor: '#B874CE', '&:hover': { bgcolor: '#A45DBB' } }}
                                                                            >
                                                                                {labels.CATALOG_SEARCH_BUTTON ?? 'Пошук комплектуючих'}
                                                                            </Button>
                                                                        </Box>

                                                                        {/* Results */}
                                                                        {catalogSearchDone && (
                                                                            loadingCatalog ? (
                                                                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}><CircularProgress size={16} /></Box>
                                                                            ) : availableCatalog.length === 0 ? (
                                                                                <Typography variant="body2" color="text.disabled" sx={{ py: 0.4 }}>—</Typography>
                                                                            ) : (
                                                                                availableCatalog.slice(0, 10).map((comp) => (
                                                                                    <Box
                                                                                        key={comp.id}
                                                                                        sx={{
                                                                                            display: 'grid',
                                                                                            gridTemplateColumns: '1fr auto auto',
                                                                                            alignItems: 'center',
                                                                                            gap: 0.5,
                                                                                            py: 0.4,
                                                                                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                                                                                        }}
                                                                                    >
                                                                                        <Box sx={{ minWidth: 0 }}>
                                                                                            <Typography noWrap sx={{ fontSize: '0.76rem', lineHeight: 1.3 }}>
                                                                                                {[comp.categoryName, comp.producerName, comp.name].filter(Boolean).join(' · ')}
                                                                                            </Typography>
                                                                                            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                                                                                                {fmtPrice(comp.price)} грн.
                                                                                            </Typography>
                                                                                        </Box>
                                                                                        <TextField
                                                                                            size="small"
                                                                                            type="number"
                                                                                            value={catalogQty[comp.id] ?? 1}
                                                                                            onChange={(e) => setCatalogQty((q) => ({ ...q, [comp.id]: Math.max(1, Number(e.target.value)) }))}
                                                                                            slotProps={{ htmlInput: { min: 1, style: { width: 40, textAlign: 'center', padding: '2px 4px' } } }}
                                                                                            sx={{ '& .MuiInputBase-root': { fontSize: '0.76rem' } }}
                                                                                        />
                                                                                        <Button
                                                                                            size="small"
                                                                                            variant="contained"
                                                                                            onClick={() => addComponentToService(repair.localId, svc.localId, comp)}
                                                                                            sx={{ minWidth: 0, px: 1, fontSize: '0.72rem', bgcolor: '#B874CE', '&:hover': { bgcolor: '#A45DBB' } }}
                                                                                        >
                                                                                            {labels.SERVICE_FORM_ADD_COMPONENT_BUTTON ?? 'Додати'}
                                                                                        </Button>
                                                                                    </Box>
                                                                                ))
                                                                            )
                                                                        )}
                                                                    </Box>
                                                                </Collapse>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            )}

                                            {availableServices.length > 0 && (
                                                <Box sx={{ pl: { xs: 0, md: 3.5 } }}>
                                                    {loadingServices ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<AddIcon />}
                                                            onClick={() => addService(repair.localId)}
                                                            disabled={isSubmitting}
                                                            sx={{ borderStyle: 'dashed' }}
                                                        >
                                                            {labels.REPAIR_PLAN_ADD_SERVICE_BUTTON ?? 'Додати послугу'}
                                                        </Button>
                                                    )}
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            ))
                        )}

                    </Box>

                    <Box sx={{ mt: 1.2, display: 'flex', justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            onClick={addRepair}
                            disabled={isSubmitting || priorities.length === 0}
                            sx={{ bgcolor: '#B874CE', '&:hover': { bgcolor: '#A45DBB' } }}
                        >
                            {labels.REPAIR_PLAN_ADD_BUTTON}
                        </Button>
                    </Box>

                    <Box sx={actionRowSx}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            disabled={isSubmitting}
                            onClick={closePlanning}
                        >
                            {labels.REPAIR_PLAN_CANCEL_BUTTON}
                        </Button>
                        <Button
                            variant="contained"
                            disabled={isSubmitting}
                            onClick={approveRepairs}
                        >
                            {isSubmitting ? (
                                <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                            ) : null}
                            {labels.REPAIR_PLAN_APPROVE_BUTTON}
                        </Button>
                    </Box>
                </>
            )}

            <Snackbar
                open={snackbarState.open}
                autoHideDuration={3200}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={closeSnackbar} severity={snackbarState.severity} sx={{ width: '100%' }}>
                    {snackbarState.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default AdminRepairPlanningPanel;
