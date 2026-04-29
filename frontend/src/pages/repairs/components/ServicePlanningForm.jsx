import React, { useEffect, useRef, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Collapse,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    Slider,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { fetchAvailableOrderServices, fetchMyServices } from '../../../services/ordersService';
import {
    fetchComponentCategories,
    fetchComponentPriceRange,
    fetchComponentProducers,
    fetchComponents,
} from '../../../services/componentsService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtPrice = (value) =>
    Number(value).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Planning form for adding a service (with components) to a repair.
 * Service options are loaded from the authenticated worker's backend catalog.
 *
 * Props:
 *   labels    — ORDER_DETAILS section of the i18n labels
 *   onCancel  — called when "Відмінити послугу" is clicked
 *   onSubmit  — called with { workerServiceId, requiredComponents } when submit button is clicked
 */
const ServicePlanningForm = ({
    labels,
    onCancel,
    onSubmit,
    deviceTypeName = '',
    mode = 'create',
    initialWorkerServiceId = null,
    initialServiceName = '',
    initialRequiredComponents = [],
    submitLabel,
    cancelLabel,
    submitErrorFallback,
    orderNumber = '',
}) => {
    // Service search
    const [serviceSearch, setServiceSearch] = useState('');
    const [selectedService, setSelectedService] = useState(null);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);

    // Required components list: [{id, name, price, producer, quantity}]
    // Lazy initializer so we never depend on `initialRequiredComponents` in a useEffect
    // (the default `= []` creates a new reference every render → infinite loop).
    // The form always fully remounts when opened, so the initializer is sufficient.
    const [required, setRequired] = useState(() => {
        if (!Array.isArray(initialRequiredComponents)) return [];
        return initialRequiredComponents
            .filter((item) => item?.id != null)
            .map((item) => ({
                id: item.id,
                name: item.name ?? '',
                price: item.price ?? 0,
                producerName: item.producerName ?? null,
                categoryName: item.categoryName ?? null,
                quantity: Math.max(1, Number(item.quantity ?? item.requiredQuantity ?? 1)),
                requiredQuantity: Math.max(1, Number(item.quantity ?? item.requiredQuantity ?? 1)),
                stockQuantity: item.stockQuantity ?? 0,
            }));
    });

    // Component filter state
    const [componentSearch, setComponentSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedProducer, setSelectedProducer] = useState(null);
    const [componentCategories, setComponentCategories] = useState([]);
    const [componentProducers, setComponentProducers] = useState([]);
    const [catalogComponents, setCatalogComponents] = useState([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [catalogSearchPerformed, setCatalogSearchPerformed] = useState(false);
    const [priceRangeLoaded, setPriceRangeLoaded] = useState(false);
    const [priceMinLimit, setPriceMinLimit] = useState(0);
    const [priceMaxLimit, setPriceMaxLimit] = useState(20000);
    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(20000);
    const [sliderValue, setSliderValue] = useState([0, 20000]);
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [servicePrefilled, setServicePrefilled] = useState(false);

    // Per-row quantity for catalog items (before Add is clicked)
    const [catalogQty, setCatalogQty] = useState({});

    const isEditMode = mode === 'edit';

    const leftColumnRef = useRef(null);

    // ── Derived ──────────────────────────────────────────────────────────────

    useEffect(() => {
        let cancelled = false;

        setLoadingServices(true);
        const loadServices = async () => {
            const normalizedOrderNumber = String(orderNumber || '').trim();

            if (normalizedOrderNumber) {
                try {
                    return await fetchAvailableOrderServices(normalizedOrderNumber);
                } catch {
                    // Fallback to generic catalog to keep form usable when the order-specific
                    // endpoint is temporarily unavailable.
                }
            }

            return fetchMyServices();
        };

        loadServices()
            .then((data) => {
                if (!cancelled) {
                    setServices(
                        Array.isArray(data)
                            ? data.map((item) => ({
                                id: item.workerServiceId,
                                workerServiceId: item.workerServiceId,
                                serviceId: item.serviceId,
                                name: item.serviceName,
                                price: item.estimatedPrice ?? null,
                                categoryName: item.categoryName ?? null,
                                complexityValue: item.complexityValue ?? null,
                                deviceTypeName: item.deviceTypeName ?? null,
                            }))
                            : []
                    );
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setServices([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingServices(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [orderNumber]);

    useEffect(() => {
        if (loadingServices || servicePrefilled || selectedService) return;

        const matchedByWorkerServiceId = initialWorkerServiceId != null
            ? services.find((item) => Number(item.workerServiceId) === Number(initialWorkerServiceId))
            : null;

        const matchedByName = initialServiceName
            ? services.find((item) => item.name?.toLowerCase() === String(initialServiceName).toLowerCase())
            : null;

        const matched = matchedByWorkerServiceId || matchedByName || null;
        if (matched) {
            setSelectedService(matched);
            setServiceSearch(matched.name ?? '');
        }

        setServicePrefilled(true);
    }, [
        loadingServices,
        servicePrefilled,
        selectedService,
        services,
        initialWorkerServiceId,
        initialServiceName,
    ]);

    useEffect(() => {
        let cancelled = false;

        Promise.all([fetchComponentCategories(), fetchComponentProducers()])
            .then(([categories, producers]) => {
                if (cancelled) return;

                const normalizedCategories = Array.isArray(categories)
                    ? categories.filter((item) => item?.name)
                    : [];
                const normalizedProducers = Array.isArray(producers)
                    ? producers.filter((item) => item?.name)
                    : [];

                setComponentCategories(normalizedCategories);
                setComponentProducers(normalizedProducers);
            })
            .catch(() => {
                if (cancelled) return;

                setComponentCategories([]);
                setComponentProducers([]);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        fetchComponentPriceRange()
            .then((range) => {
                if (cancelled) return;

                const minPrice = Number.isFinite(range?.minPrice) ? range.minPrice : 0;
                const maxPrice = Number.isFinite(range?.maxPrice) ? range.maxPrice : 0;

                setPriceMinLimit(minPrice);
                setPriceMaxLimit(maxPrice);
                setPriceMin(minPrice);
                setPriceMax(maxPrice);
                setSliderValue([minPrice, maxPrice]);
                setPriceRangeLoaded(true);
            })
            .catch(() => {
                if (cancelled) return;

                setPriceMinLimit(0);
                setPriceMaxLimit(20000);
                setPriceMin(0);
                setPriceMax(20000);
                setSliderValue([0, 20000]);
                setPriceRangeLoaded(true);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredServices = services.filter(
        (s) => {
            const matchesSearch = !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase());
            const matchesDeviceType = !deviceTypeName
                || !s.deviceTypeName
                || s.deviceTypeName.toLowerCase() === deviceTypeName.toLowerCase();

            return matchesSearch && matchesDeviceType;
        }
    );

    const requiredIds = new Set(required.map((c) => c.id));
    const filteredCatalog = catalogComponents.filter((component) => !requiredIds.has(component.id));

    // ── Handlers ─────────────────────────────────────────────────────────────

    const addToRequired = (component) => {
        const qty = catalogQty[component.id] ?? 1;
        setRequired((prev) => [...prev, { ...component, quantity: qty }]);
        setTimeout(() => {
            if (leftColumnRef.current) leftColumnRef.current.scrollTop = 0;
        }, 0);
    };

    const removeFromRequired = (id) => {
        setRequired((prev) => prev.filter((c) => c.id !== id));
    };

    const updateRequiredQty = (id, qty) => {
        setRequired((prev) =>
            prev.map((c) => (c.id === id ? { ...c, quantity: Math.max(1, qty) } : c))
        );
    };

    const handleSliderChange = (_, val) => {
        const nextMin = Math.max(priceMinLimit, Math.min(val[0], val[1]));
        const nextMax = Math.min(priceMaxLimit, Math.max(val[0], val[1]));

        setSliderValue([nextMin, nextMax]);
        setPriceMin(nextMin);
        setPriceMax(nextMax);
    };

    const handleCatalogSearch = async () => {
        if (!priceRangeLoaded) return;

        setCatalogSearchPerformed(true);
        setLoadingCatalog(true);

        try {
            const data = await fetchComponents({
                producerId: selectedProducer?.id ?? null,
                categoryId: selectedCategoryId || null,
                minPrice: priceMin,
                maxPrice: priceMax,
                search: componentSearch,
            });
            setCatalogComponents(Array.isArray(data) ? data : []);
        } catch {
            setCatalogComponents([]);
        } finally {
            setLoadingCatalog(false);
        }
    };

    const handleSubmit = async () => {
        const match = selectedService ?? filteredServices.find((s) =>
            s.name.toLowerCase() === serviceSearch.toLowerCase()
        );

        if (!match?.id) {
            setSubmitError(labels.SERVICE_FORM_SELECT_SERVICE_REQUIRED || 'Оберіть послугу перед збереженням.');
            return;
        }

        setSubmitError('');
        setSubmitting(true);
        try {
            await onSubmit?.({ workerServiceId: match.id, requiredComponents: required });
        } catch (err) {
            setSubmitError(
                err?.response?.data?.error
                || submitErrorFallback
                || (isEditMode
                    ? (labels.SERVICE_EDIT_FAILED || 'Не вдалося оновити послугу.')
                    : (labels.SERVICE_PLAN_FAILED || 'Не вдалося спланувати послугу.'))
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ── Sub-renders ───────────────────────────────────────────────────────────

    const renderRequiredList = () => (
        <>
            <Divider sx={{ my: 0.6 }}>
                <Typography variant="caption" color="text.secondary">
                    {labels.SERVICE_FORM_NEEDED_SECTION}
                </Typography>
            </Divider>
            {required.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ py: 0.4, pl: 0.5 }}>
                    —
                </Typography>
            ) : (
                required.map((c) => (
                    <Box
                        key={c.id}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto',
                            alignItems: 'center',
                            gap: 1,
                            py: 0.6,
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                noWrap
                                sx={{ fontSize: '0.78rem', fontWeight: 500, lineHeight: 1.3 }}
                            >
                                {[c.categoryName, c.producerName, c.name].filter(Boolean).join(' · ')}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.3 }}>
                                {labels.COMPONENT_PRICE_LABEL}: {fmtPrice(c.price)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
                            <Typography variant="caption" color="text.secondary">
                                {labels.SERVICE_FORM_QTY_LABEL}
                            </Typography>
                            <TextField
                                size="small"
                                type="number"
                                value={c.quantity}
                                onChange={(e) => updateRequiredQty(c.id, Number(e.target.value))}
                                slotProps={{
                                    htmlInput: {
                                        min: 1,
                                        style: { width: 44, textAlign: 'center', padding: '3px 6px' },
                                    },
                                }}
                                sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                            />
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => removeFromRequired(c.id)}
                            aria-label={labels.SERVICE_FORM_REMOVE_COMPONENT_BUTTON || 'Remove component'}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ))
            )}
        </>
    );

    const renderCatalogList = () => (
        <>
            <Divider sx={{ my: 0.6 }}>
                <Typography variant="caption" color="text.secondary">
                    {labels.SERVICE_FORM_ADD_COMPONENT_SECTION}
                </Typography>
            </Divider>
            {!catalogSearchPerformed && (
                <Typography variant="body2" color="text.disabled" sx={{ py: 0.4, pl: 0.5 }}>
                    Натисніть кнопку пошуку, щоб завантажити комплектуючі.
                </Typography>
            )}
            {loadingCatalog ? (
                <Typography variant="body2" color="text.disabled" sx={{ py: 0.4, pl: 0.5 }}>
                    Завантаження...
                </Typography>
            ) : filteredCatalog.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ py: 0.4, pl: 0.5 }}>
                    —
                </Typography>
            ) : (
                filteredCatalog.map((c) => (
                    <Box
                        key={c.id}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto',
                            alignItems: 'center',
                            gap: 0.8,
                            py: 0.6,
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                noWrap
                                sx={{ fontSize: '0.78rem', lineHeight: 1.3 }}
                            >
                                {[c.categoryName, c.producerName, c.name].filter(Boolean).join(' · ')}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.3 }}>
                                {labels.COMPONENT_PRICE_LABEL}: {fmtPrice(c.price)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
                            <Typography variant="caption" color="text.secondary">
                                {labels.SERVICE_FORM_QTY_LABEL}
                            </Typography>
                            <TextField
                                size="small"
                                type="number"
                                value={catalogQty[c.id] ?? 1}
                                onChange={(e) =>
                                    setCatalogQty((prev) => ({
                                        ...prev,
                                        [c.id]: Math.max(1, Number(e.target.value)),
                                    }))
                                }
                                slotProps={{
                                    htmlInput: {
                                        min: 1,
                                        style: { width: 44, textAlign: 'center', padding: '3px 6px' },
                                    },
                                }}
                                sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                            />
                        </Box>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => addToRequired(c)}
                            sx={{
                                bgcolor: '#B874CE',
                                '&:hover': { bgcolor: '#A45DBB' },
                                minWidth: 0,
                                px: 1.5,
                                fontSize: '0.78rem',
                            }}
                        >
                            {labels.SERVICE_FORM_ADD_COMPONENT_BUTTON}
                        </Button>
                    </Box>
                ))
            )}
        </>
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Box>
            {/* Service search */}
            <Autocomplete
                fullWidth
                size="small"
                options={filteredServices}
                value={selectedService}
                inputValue={serviceSearch}
                loading={loadingServices}
                disableClearable={false}
                onChange={(_, value) => {
                    setSelectedService(value);
                    setServiceSearch(value?.name ?? '');
                }}
                onInputChange={(_, value, reason) => {
                    if (selectedService && reason === 'input') {
                        return;
                    }
                    setServiceSearch(value);
                    if (reason === 'clear') {
                        setSelectedService(null);
                    }
                }}
                getOptionLabel={(option) => option?.name ?? ''}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                noOptionsText={loadingServices ? 'Завантаження...' : (labels.SERVICE_FORM_NO_SERVICES_FOUND || 'Нічого не знайдено')}
                renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                            <Typography variant="body2" noWrap>
                                {option.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                {fmtPrice(option.price)}
                            </Typography>
                        </Box>
                    </li>
                )}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={labels.SERVICE_FORM_SEARCH_SERVICE}
                        InputProps={{
                            ...params.InputProps,
                            readOnly: Boolean(selectedService),
                        }}
                    />
                )}
                sx={{ mb: 1.2, bgcolor: 'background.paper', borderRadius: 1 }}
            />

            {/* Components section header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.6, gap: 0.5 }}>
                <Typography variant="body2" fontWeight={700}>
                    {labels.SERVICE_FORM_COMPONENTS_SECTION}
                </Typography>
                <IconButton size="small">
                    <AddIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Two-column: left = content, right = filters */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: filtersOpen ? '1.3fr 1fr' : '1fr' },
                    border: '1px solid rgba(0,0,0,0.13)',
                    borderRadius: 1,
                    overflow: 'hidden',
                    mb: 1.5,
                }}
            >
                {/* Left — required + catalog */}
                <Box
                    ref={leftColumnRef}
                    sx={{
                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                        p: 1.2,
                        maxHeight: 310,
                        overflowY: 'auto',
                        borderRight: { sm: filtersOpen ? '1px solid rgba(0,0,0,0.1)' : 'none' },
                    }}
                >
                    {renderRequiredList()}
                    {renderCatalogList()}
                </Box>

                {/* Right — filters */}
                <Box
                    sx={{
                        bgcolor: 'rgba(236,243,250,0.9)',
                        p: 1.2,
                        borderTop: { xs: '1px solid rgba(0,0,0,0.1)', sm: filtersOpen ? 'none' : '1px solid rgba(0,0,0,0.1)' },
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 0.4,
                            px: 0.2,
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={() => setFiltersOpen((open) => !open)}
                            aria-label={filtersOpen ? 'Collapse filters' : 'Expand filters'}
                            sx={{
                                border: '1px solid rgba(176, 134, 206, 0.4)',
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'rgba(184,116,206,0.08)' },
                            }}
                        >
                            {filtersOpen ? (
                                <ExpandLessIcon fontSize="small" />
                            ) : (
                                <TuneIcon fontSize="small" color="action" />
                            )}
                        </IconButton>
                    </Box>

                    <Typography variant="body2" fontWeight={700} sx={{ letterSpacing: 0.2, mb: filtersOpen ? 0.8 : 0 }}>
                        {labels.SERVICE_FORM_PRICE_RANGE}
                    </Typography>

                    <Collapse in={filtersOpen}>
                        {/* Slider */}
                        <Slider
                            size="small"
                            value={sliderValue}
                            min={priceMinLimit}
                            max={priceMaxLimit}
                            step={100}
                            onChange={handleSliderChange}
                            sx={{ color: '#B874CE', mb: 0.2 }}
                        />

                        {/* Min / Max inputs */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1.2 }}>
                            <TextField
                                size="small"
                                type="number"
                                value={priceMin}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    const nextMin = Math.min(v, priceMax);
                                    setPriceMin(nextMin);
                                    setSliderValue([nextMin, priceMax]);
                                }}
                                slotProps={{
                                    htmlInput: { style: { padding: '4px 8px' } },
                                }}
                                sx={{ flex: 1, bgcolor: 'background.paper' }}
                            />
                            <Typography variant="body2" color="text.disabled">—</Typography>
                            <TextField
                                size="small"
                                type="number"
                                value={priceMax}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    const nextMax = Math.max(v, priceMin);
                                    setPriceMax(nextMax);
                                    setSliderValue([priceMin, nextMax]);
                                }}
                                slotProps={{
                                    htmlInput: { style: { padding: '4px 8px' } },
                                }}
                                sx={{ flex: 1, bgcolor: 'background.paper' }}
                            />
                        </Box>

                        {/* Component search */}
                        <TextField
                            fullWidth
                            size="small"
                            placeholder={labels.SERVICE_FORM_SEARCH_COMPONENT}
                            value={componentSearch}
                            onChange={(e) => setComponentSearch(e.target.value)}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            sx={{ mb: 1, bgcolor: 'background.paper' }}
                        />

                        {/* Category select */}
                        <Select
                            fullWidth
                            size="small"
                            displayEmpty
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                            renderValue={(v) => {
                                if (v === '') return labels.SERVICE_FORM_COMPONENT_CATEGORY;
                                const selected = componentCategories.find((category) => category.id === v);
                                return selected?.name || labels.SERVICE_FORM_COMPONENT_CATEGORY;
                            }}
                            sx={{ mb: 1, bgcolor: 'background.paper', fontSize: '0.87rem' }}
                        >
                            <MenuItem value=""><em>—</em></MenuItem>
                            {componentCategories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                            ))}
                        </Select>

                        {/* Producer multi-select */}
                        <Box
                            sx={{
                                border: '1px solid rgba(176, 134, 206, 0.45)',
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                overflow: 'hidden',
                                px: 1,
                                py: 0.7,
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: 0.2, mb: 0.7 }}>
                                {labels.SERVICE_FORM_PRODUCER}
                            </Typography>
                            <Autocomplete
                                size="small"
                                options={componentProducers}
                                value={selectedProducer}
                                onChange={(_, value) => setSelectedProducer(value)}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                getOptionLabel={(option) => option?.name ?? ''}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder={labels.SERVICE_FORM_PRODUCER}
                                    />
                                )}
                            />
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleCatalogSearch}
                            disabled={!priceRangeLoaded || loadingCatalog}
                            sx={{
                                mt: 1,
                                bgcolor: '#B874CE',
                                '&:hover': { bgcolor: '#A45DBB' },
                            }}
                        >
                            Пошук комплектуючих
                        </Button>
                    </Collapse>
                </Box>
            </Box>

            {/* Action row */}
            {submitError ? (
                <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                    {submitError}
                </Typography>
            ) : null}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Button variant="outlined" color="inherit" onClick={onCancel} disabled={submitting}>
                    {cancelLabel || labels.SERVICE_FORM_CANCEL_BUTTON}
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                    {submitLabel || labels.SERVICE_FORM_SUBMIT_BUTTON}
                </Button>
            </Box>
        </Box>
    );
};

export default ServicePlanningForm;
