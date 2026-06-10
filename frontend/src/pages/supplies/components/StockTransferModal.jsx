import React, { useEffect, useMemo, useState } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    IconButton,
    MenuItem,
    Select,
    Snackbar,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { fetchMissingStock, fetchBranches, fetchMyBranch, transferStock } from '../../../services/stockService';
import { useLanguage } from '../../../app/i18n/LanguageContext';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const toggleSetValue = (prev, value) => {
    const next = new Set(prev);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
};

// ─── FilterGroup ───────────────────────────────────────────────────────────────

const FilterGroup = ({ title, items, selected, onToggle, onSelectAll }) => {
    const allActive = selected.size === 0;

    return (
        <Accordion
            defaultExpanded
            disableGutters
            elevation={0}
            sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{ px: 0.5, minHeight: 34, '& .MuiAccordionSummary-content': { my: 0.4 } }}
            >
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{title}</Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0, pb: 0.5 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            size="small"
                            checked={allActive}
                            indeterminate={!allActive && selected.size < items.length}
                            onChange={onSelectAll}
                            sx={{ py: 0.2, color: '#B874CE', '&.Mui-checked': { color: '#B874CE' } }}
                        />
                    }
                    label={<Typography sx={{ fontSize: '0.78rem' }}>Всі</Typography>}
                    sx={{ ml: 0, display: 'flex', width: '100%' }}
                />

                {items.map((item) => (
                    <FormControlLabel
                        key={item.key}
                        control={
                            <Checkbox
                                size="small"
                                checked={allActive || selected.has(item.key)}
                                onChange={() => onToggle(item.key)}
                                sx={{ py: 0.2, color: '#B874CE', '&.Mui-checked': { color: '#B874CE' } }}
                            />
                        }
                        label={
                            <Typography sx={{ fontSize: '0.78rem' }} noWrap title={item.label}>
                                {item.label}
                            </Typography>
                        }
                        sx={{ ml: 0, display: 'flex', width: '100%' }}
                    />
                ))}
            </AccordionDetails>
        </Accordion>
    );
};

// ─── SourceBranchRow ──────────────────────────────────────────────────────────

/**
 * One row for a source branch that has the needed component.
 *
 * Props:
 *   item            — { componentId, otherBranchAddress, quantityInOtherBranch, requiredQuantity }
 *   fromBranchId    — resolved from branchIdByAddress map
 *   userBranchId    — current user's branch id (number|null) — used as default destination
 *   branches        — full list from GET /api/branches
 *   onTransferDone  — callback({ success: true }) after successful transfer
 */
const SourceBranchRow = ({ item, fromBranchId, userBranchId, branches, onTransferDone, lang }) => {
    const [open, setOpen] = useState(false);
    const [toBranchId, setToBranchId] = useState('');
    const [qty, setQty] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [rowError, setRowError] = useState('');

    const maxQty = item.quantityInOtherBranch;

    // Branches available as destination (exclude this source branch)
    const availableBranches = branches.filter((b) => b.id !== fromBranchId);

    const handleOpen = () => {
        // Pre-select user's own branch as destination if it differs from source
        const defaultId =
            userBranchId != null && Number(userBranchId) !== fromBranchId
                ? Number(userBranchId)
                : (availableBranches[0]?.id ?? '');
        setToBranchId(defaultId);
        setQty(Math.min(item.requiredQuantity, maxQty));
        setRowError('');
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleConfirm = async () => {
        if (!toBranchId) { setRowError(lang === 'ua' ? 'Оберіть відділення-отримувач.' : 'Select a destination branch.'); return; }
        if (fromBranchId == null) { setRowError(lang === 'ua' ? 'Не вдалося визначити відділення-відправник.' : 'Could not determine the source branch.'); return; }
        if (qty < 1 || qty > maxQty) { setRowError(lang === 'ua' ? `Кількість має бути від 1 до ${maxQty}.` : `Quantity must be between 1 and ${maxQty}.`); return; }

        setSubmitting(true);
        setRowError('');
        try {
            await transferStock({
                fromBranchId: Number(fromBranchId),
                toBranchId: Number(toBranchId),
                componentId: item.componentId,
                quantity: qty,
            });
            setOpen(false);
            onTransferDone?.({ success: true });
        } catch (err) {
            const msg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                (lang === 'ua' ? 'Не вдалося виконати переміщення.' : 'Failed to perform the transfer.');
            setRowError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                py: 1,
                borderBottom: '1px solid rgba(0,0,0,0.07)',
                '&:last-child': { borderBottom: 'none' },
            }}
        >
            {/* ── Main row ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {item.otherBranchAddress}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                        {lang === 'ua' ? 'Наявна кількість:' : 'Available quantity:'} {item.quantityInOtherBranch}
                    </Typography>
                </Box>

                <Button
                    size="small"
                    variant="contained"
                    onClick={handleOpen}
                    disabled={maxQty === 0 || open || fromBranchId == null}
                    sx={{
                        bgcolor: '#B874CE',
                        '&:hover': { bgcolor: '#A45DBB' },
                        '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.12)' },
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        fontSize: '0.8rem',
                    }}
                >
                    {lang === 'ua' ? 'Перемістити' : 'Transfer'}
                </Button>
            </Box>

            {/* ── Inline transfer form ── */}
            {open && (
                <Box
                    sx={{
                        mt: 1,
                        ml: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2,
                        flexWrap: 'wrap',
                        p: 1,
                        bgcolor: 'rgba(184,116,206,0.06)',
                        border: '1px solid rgba(184,116,206,0.25)',
                        borderRadius: 1,
                    }}
                >
                    <Typography sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {lang === 'ua' ? 'Перемістити до:' : 'Transfer to:'}
                    </Typography>

                    <Select
                        size="small"
                        value={toBranchId}
                        onChange={(e) => setToBranchId(e.target.value)}
                        displayEmpty
                        disabled={submitting}
                        sx={{ minWidth: 200, fontSize: '0.82rem', bgcolor: 'background.paper' }}
                        renderValue={(val) =>
                            val === ''
                                ? <em style={{ color: '#9e9e9e' }}>{lang === 'ua' ? 'Вибрати відділення' : 'Select branch'}</em>
                                : branches.find((b) => b.id === Number(val))?.address ?? val
                        }
                    >
                        {availableBranches.map((b) => (
                            <MenuItem key={b.id} value={b.id} sx={{ fontSize: '0.82rem' }}>
                                {b.address}
                            </MenuItem>
                        ))}
                    </Select>

                    {/* Quantity stepper */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid rgba(0,0,0,0.23)',
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            overflow: 'hidden',
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            disabled={submitting || qty <= 1}
                            sx={{ borderRadius: 0, px: 0.8 }}
                        >
                            <RemoveIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                        <Typography
                            sx={{
                                minWidth: 36,
                                textAlign: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                userSelect: 'none',
                            }}
                        >
                            {qty}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                            disabled={submitting || qty >= maxQty}
                            sx={{ borderRadius: 0, px: 0.8 }}
                        >
                            <AddIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                    </Box>

                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleConfirm}
                        disabled={submitting || !toBranchId}
                        sx={{ bgcolor: '#B874CE', '&:hover': { bgcolor: '#A45DBB' }, fontSize: '0.8rem' }}
                    >
                        {submitting && <CircularProgress size={14} color="inherit" sx={{ mr: 0.7 }} />}
                        {lang === 'ua' ? 'Підтвердити' : 'Confirm'}
                    </Button>

                    <Button
                        variant="text"
                        size="small"
                        onClick={handleClose}
                        disabled={submitting}
                        color="inherit"
                        sx={{ fontSize: '0.8rem' }}
                    >
                        {lang === 'ua' ? 'Скасувати' : 'Cancel'}
                    </Button>

                    {rowError && (
                        <Typography sx={{ fontSize: '0.75rem', color: 'error.main', width: '100%', mt: 0.2 }}>
                            {rowError}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};

// ─── MissingComponentGroup ────────────────────────────────────────────────────

const MissingComponentGroup = ({
    componentId,
    componentModel,
    categoryName,
    manufacturer,
    requiredQuantity,
    rows,
    branchIdByAddress,
    userBranchId,
    branches,
    onTransferDone,
    lang,
}) => (
    <Box sx={{ mb: 3 }}>
        <Divider sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ letterSpacing: 0.2 }}
                >
                    {[categoryName, manufacturer, componentModel].filter(Boolean).join(' · ')}
                </Typography>
                <Chip
                    label={lang === 'ua' ? `Потрібно: ${requiredQuantity}` : `Required: ${requiredQuantity}`}
                    size="small"
                    sx={{
                        height: 18,
                        fontSize: '0.7rem',
                        bgcolor: 'rgba(184,116,206,0.15)',
                        border: '1px solid rgba(184,116,206,0.35)',
                    }}
                />
            </Box>
        </Divider>

        {rows.map((row, idx) => (
            <SourceBranchRow
                key={`${componentId}-${row.otherBranchAddress}-${idx}`}
                item={{ ...row, componentId, requiredQuantity }}
                fromBranchId={branchIdByAddress.get(row.otherBranchAddress)}
                userBranchId={userBranchId}
                branches={branches}
                onTransferDone={onTransferDone}
                lang={lang}
            />
        ))}
    </Box>
);

// ─── StockTransferModal ────────────────────────────────────────────────────────

/**
 * Props:
 *   open             — boolean
 *   onClose          — callback
 *   mode             — 'master' | 'admin'
 *                      'master': component chip pre-set to initialComponent (clearable),
 *                                destination dropdown defaults to user's own branch,
 *                                no left filter panel
 *                      'admin':  no component pre-filter, left filter panel shown
 *   initialComponent — { id, name, categoryName, producerName }
 *                      In master mode — sets the default component chip filter.
 */
const StockTransferModal = ({ open, onClose, onTransferDone: onTransferDoneExternal, mode = 'master', initialComponent = null }) => {
    const { lang } = useLanguage();
    const [userBranchId, setUserBranchId] = useState(null);

    const [missingData, setMissingData] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState('');

    // Active component chip filter (master: pre-set, clearable; admin: not used)
    const [componentFilter, setComponentFilter] = useState(null);

    // Admin-mode checkbox filters — empty Set = "all selected"
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [selectedManufacturers, setSelectedManufacturers] = useState(new Set());
    const [selectedBranches, setSelectedBranches] = useState(new Set());

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isMaster = mode === 'master';

    // ── Load ──────────────────────────────────────────────────────────────────

    const loadData = async (signal) => {
        const [missing, branchList, myBranch] = await Promise.all([
            fetchMissingStock(),   // always fetch all — filter client-side
            fetchBranches(),
            fetchMyBranch(),
        ]);
        if (signal?.aborted) return;
        setMissingData(Array.isArray(missing) ? missing : []);
        setBranches(Array.isArray(branchList) ? branchList : []);
        setUserBranchId(myBranch?.id ?? null);
    };

    useEffect(() => {
        if (!open) return;

        // Reset component chip to clicked component each time modal opens
        setComponentFilter(isMaster ? initialComponent : null);

        const controller = new AbortController();
        setLoading(true);
        setFetchError('');

        loadData(controller.signal)
            .catch(() => {
                if (!controller.signal.aborted)
                    setFetchError(lang === 'ua' ? 'Не вдалося завантажити дані складу.' : 'Failed to load stock data.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Branch-address → id map ───────────────────────────────────────────────

    const branchIdByAddress = useMemo(() => {
        const map = new Map();
        branches.forEach((b) => map.set(b.address, b.id));
        return map;
    }, [branches]);

    // ── Group missing rows by componentId ─────────────────────────────────────

    const componentGroups = useMemo(() => {
        const map = new Map();
        missingData.forEach((item) => {
            if (!map.has(item.componentId)) {
                map.set(item.componentId, {
                    componentId: item.componentId,
                    componentModel: item.componentModel,
                    categoryName: item.categoryName,
                    manufacturer: item.manufacturer,
                    requiredQuantity: item.requiredQuantity,
                    rows: [],
                });
            }
            map.get(item.componentId).rows.push({
                otherBranchAddress: item.otherBranchAddress,
                quantityInOtherBranch: item.quantityInOtherBranch,
            });
        });
        return [...map.values()];
    }, [missingData]);

    // ── Filter options (admin panel) ──────────────────────────────────────────

    const categoryItems = useMemo(
        () => [...new Set(componentGroups.map((g) => g.categoryName).filter(Boolean))].sort()
            .map((n) => ({ key: n, label: n })),
        [componentGroups]
    );

    const manufacturerItems = useMemo(
        () => [...new Set(componentGroups.map((g) => g.manufacturer).filter(Boolean))].sort()
            .map((n) => ({ key: n, label: n })),
        [componentGroups]
    );

    const branchFilterItems = useMemo(() => {
        const seen = new Set();
        const result = [];
        missingData.forEach((item) => {
            const addr = item.otherBranchAddress ?? '';
            if (!seen.has(addr)) {
                seen.add(addr);
                result.push({ key: addr, label: addr });
            }
        });
        return result.sort((a, b) => (a.label ?? '').localeCompare(b.label ?? '', 'uk'));
    }, [missingData]);

    // ── Apply all filters ─────────────────────────────────────────────────────

    const visibleGroups = useMemo(() => {
        return componentGroups
            .filter((g) => {
                // Component chip filter (master: pre-set; can be cleared)
                if (componentFilter != null && g.componentId !== componentFilter.id)
                    return false;
                // Admin panel filters
                if (selectedCategories.size > 0 && !selectedCategories.has(g.categoryName))
                    return false;
                if (selectedManufacturers.size > 0 && !selectedManufacturers.has(g.manufacturer))
                    return false;
                return true;
            })
            .map((g) => {
                if (selectedBranches.size === 0) return g;
                return {
                    ...g,
                    rows: g.rows.filter((r) => selectedBranches.has(r.otherBranchAddress)),
                };
            })
            .filter((g) => g.rows.length > 0);
    }, [componentGroups, componentFilter, selectedCategories, selectedManufacturers, selectedBranches]);

    // ── Transfer done ─────────────────────────────────────────────────────────

    const handleTransferDone = async ({ success }) => {
        if (!success) return;
        setSnackbar({ open: true, message: lang === 'ua' ? 'Переміщення виконано успішно.' : 'Transfer completed successfully.', severity: 'success' });
        // Notify parent so it can refresh its own data (e.g. stockQuantity on ComponentCard)
        onTransferDoneExternal?.();
        // Refresh modal's own missing-stock list
        setLoading(true);
        try {
            await loadData();
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    };

    const makeToggle = (setFn) => (key) => setFn((prev) => toggleSetValue(prev, key));
    const makeSelectAll = (setFn) => () => setFn(new Set());

    // Component chip label
    const componentChipLabel = componentFilter
        ? [componentFilter.categoryName, componentFilter.producerName, componentFilter.name]
              .filter(Boolean)
              .join(' · ')
        : null;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            slotProps={{ paper: { sx: { height: '92vh', maxHeight: '92vh', overflow: 'hidden' } } }}
        >
            {/* Header — DialogTitle renders as <h2>; do NOT nest <Typography> inside */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                {lang === 'ua' ? 'Переміщення комплектуючих' : 'Component transfer'}
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ display: 'flex', p: 0, overflow: 'hidden' }}>

                {/* ── Left: filter panel (admin mode only) ── */}
                {!isMaster && (
                    <Box
                        sx={{
                            width: 230,
                            flexShrink: 0,
                            overflowY: 'auto',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            p: 1.5,
                            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F6FB',
                        }}
                    >
                        <FilterGroup
                            title={lang === 'ua' ? 'Категорія' : 'Category'}
                            items={categoryItems}
                            selected={selectedCategories}
                            onToggle={makeToggle(setSelectedCategories)}
                            onSelectAll={makeSelectAll(setSelectedCategories)}
                        />
                        <Divider sx={{ my: 0.5 }} />
                        <FilterGroup
                            title={lang === 'ua' ? 'Виробник' : 'Manufacturer'}
                            items={manufacturerItems}
                            selected={selectedManufacturers}
                            onToggle={makeToggle(setSelectedManufacturers)}
                            onSelectAll={makeSelectAll(setSelectedManufacturers)}
                        />
                        <Divider sx={{ my: 0.5 }} />
                        <FilterGroup
                            title={lang === 'ua' ? 'Відділення-відправник' : 'Source branch'}
                            items={branchFilterItems}
                            selected={selectedBranches}
                            onToggle={makeToggle(setSelectedBranches)}
                            onSelectAll={makeSelectAll(setSelectedBranches)}
                        />
                    </Box>
                )}

                {/* ── Right: content area ── */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>

                    {/* Component chip filter (deletable) */}
                    {componentChipLabel && (
                        <Box sx={{ mb: 2 }}>
                            <Chip
                                label={lang === 'ua' ? `Комплектуюча: ${componentChipLabel}` : `Component: ${componentChipLabel}`}
                                onDelete={() => setComponentFilter(null)}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(184,116,206,0.15)',
                                    border: '1px solid rgba(184,116,206,0.4)',
                                    fontWeight: 500,
                                    fontSize: '0.78rem',
                                    maxWidth: '100%',
                                }}
                            />
                        </Box>
                    )}

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : fetchError ? (
                        <Alert severity="error">{fetchError}</Alert>
                    ) : visibleGroups.length === 0 ? (
                        <Typography color="text.secondary" sx={{ pt: 2, textAlign: 'center' }}>
                            {lang === 'ua' ? 'Немає відсутніх комплектуючих або нічого не відповідає обраним фільтрам.' : 'No missing components, or nothing matches the selected filters.'}
                        </Typography>
                    ) : (
                        visibleGroups.map((group) => (
                            <MissingComponentGroup
                                key={group.componentId}
                                componentId={group.componentId}
                                componentModel={group.componentModel}
                                categoryName={group.categoryName}
                                manufacturer={group.manufacturer}
                                requiredQuantity={group.requiredQuantity}
                                rows={group.rows}
                                branchIdByAddress={branchIdByAddress}
                                userBranchId={userBranchId}
                                branches={branches}
                                onTransferDone={handleTransferDone}
                                lang={lang}
                            />
                        ))
                    )}
                </Box>
            </DialogContent>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default StockTransferModal;
