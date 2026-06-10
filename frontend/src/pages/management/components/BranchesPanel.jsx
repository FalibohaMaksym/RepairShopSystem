import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    MenuItem,
    Paper,
    Snackbar,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import SearchIcon from '@mui/icons-material/Search';
import {
    fetchDictionaryItems,
    fetchWorkerServices,
    addWorkerService,
    removeWorkerService,
    moveWorkerToBranch,
    createBranch,
    deleteBranch,
    fetchRepairServices,
} from '../../../services/dataManagementService';
import {
    fetchBranches,
    fetchWorkers,
    fetchPositions,
    fetchRoles,
    updateUser,
} from '../../../services/usersService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { useLanguage } from '../../../app/i18n/LanguageContext';

// ─── Phone helpers ────────────────────────────────────────────────────────────

const formatPhoneNumberInput = (rawValue) => {
    const rawDigits = String(rawValue ?? '').replace(/\D/g, '');
    const localDigits = rawDigits.startsWith('380') && rawDigits.length >= 12
        ? rawDigits.slice(2) : rawDigits;
    const digits = localDigits.slice(0, 10);
    if (!digits) return '';
    const area = digits.slice(0, 3);
    const p1 = digits.slice(3, 6);
    const p2 = digits.slice(6, 8);
    const p3 = digits.slice(8, 10);
    let f = '';
    if (area) { f += `(${area}`; if (area.length === 3) f += ')'; }
    if (p1) f += ` ${p1}`;
    if (p2) f += `-${p2}`;
    if (p3) f += `-${p3}`;
    return f;
};

const normalizePhoneForApi = (phoneNumber) => {
    const digits = String(phoneNumber ?? '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length === 10) return `+38${digits}`;
    if (digits.length === 12 && digits.startsWith('380')) return `+${digits}`;
    return `+${digits}`;
};

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (v) => {
    const t = (v ?? '').trim();
    return t && !EMAIL_REGEX.test(t) ? 'Невірний формат email' : '';
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_CREATE_BRANCH = { address: '', phoneNumber: '', email: '' };
const EMPTY_ADD_SERVICE   = { deviceTypeId: '', categoryId: '', serviceId: '' };

// ─── WorkerViewCard — React.memo: перемальовується тільки при зміні даних ─────

const WorkerViewCard = React.memo(({
    worker, onEdit, onStartMove,
    movingWorkerId, branches,
    moveSelectedBranch, onMoveSelectedBranchChange,
    onConfirmMove, moveSubmitting, onCancelMove,
    L,
}) => {
    const isMoving = movingWorkerId === worker.id;

    const otherBranches = useMemo(
        () => branches.filter((b) => b.id !== worker.branchId),
        [branches, worker.branchId],
    );

    return (
        <Paper sx={{ p: 1.5, mb: 1, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.15)' : '#E3F2FD', border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(100, 170, 235, 0.4)' : '1px solid #BBDEFB', boxShadow: '0 2px 6px rgba(0,0,0,0.10)', borderRadius: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography fontWeight={700}>{worker.workerFullName || worker.fullName || '—'}</Typography>
                    <Typography variant="body2"><b>{L.POSITION_PREFIX}</b> {worker.positionName || '—'}</Typography>
                    <Typography variant="body2">
                        <b>{L.PHONE_PREFIX}</b> {worker.workerPhoneNumber || worker.phoneNumber || '—'}
                        &nbsp;&nbsp;·&nbsp;&nbsp;
                        <b>Email:</b> {worker.workerEmail || worker.email || '—'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                    <Button variant="outlined" size="small" onClick={() => onEdit(worker)} sx={{ whiteSpace: 'nowrap' }}>
                        {L.EDIT_BUTTON}
                    </Button>
                    <Button variant="contained" color="secondary" size="small" onClick={() => onStartMove(worker)} sx={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        {L.MOVE_BUTTON}
                    </Button>
                </Box>
            </Box>

            {isMoving && (
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Autocomplete
                        size="small"
                        options={otherBranches}
                        getOptionLabel={(option) => option?.address ?? ''}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        value={moveSelectedBranch}
                        onChange={(_, v) => onMoveSelectedBranchChange(v)}
                        sx={{ flex: 1, minWidth: 220 }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={L.SELECT_BRANCH_LABEL}
                                sx={{ bgcolor: 'background.paper' }}
                            />
                        )}
                    />
                    <Button variant="contained" size="small" disabled={!moveSelectedBranch || moveSubmitting} onClick={() => onConfirmMove(worker.id)}
                        startIcon={moveSubmitting ? <CircularProgress size={14} color="inherit" /> : null}>
                        {L.CONFIRM_MOVE_BUTTON}
                    </Button>
                    <Button size="small" onClick={onCancelMove} color="inherit">{L.CANCEL_BUTTON}</Button>
                </Box>
            )}
        </Paper>
    );
});
WorkerViewCard.displayName = 'WorkerViewCard';

// ─── WorkerEditCard — весь стан форми локальний, батько не ре-рендериться ──────

const WorkerEditCard = React.memo(({
    worker, positions, roles,
    workerServices, loadingServices, onRemoveService,
    allServices, deviceTypes, serviceCategories,
    onAddService,
    onCancel,
    L,
}) => {
    const [addForm, setAddForm]                   = useState(EMPTY_ADD_SERVICE);
    const [addSubmitting, setAddSubmitting]       = useState(false);

    // ── Локальні хендлери ─────────────────────────────────────────────────────

    const handleAddFormChange = useCallback((field) => (e) => {
        const value = e.target.value;
        setAddForm((prev) => ({
            ...prev,
            [field]: value,
            ...(field !== 'serviceId' ? { serviceId: '' } : {}),
        }));
    }, []);

    // ── Фільтрація послуг (локальне useMemo) ──────────────────────────────────
    const filteredServices = useMemo(() => {
        const addedIds = new Set(workerServices.map((ws) => ws.serviceId));
        let result = allServices.filter((s) => !addedIds.has(s.serviceId));
        if (addForm.deviceTypeId) {
            const dtName = deviceTypes.find((dt) => dt.id == addForm.deviceTypeId)?.name;
            if (dtName) result = result.filter((s) => s.deviceTypeName === dtName);
        }
        if (addForm.categoryId) {
            const catName = serviceCategories.find((sc) => sc.id == addForm.categoryId)?.name;
            if (catName) result = result.filter((s) => s.categoryName === catName);
        }
        return result;
    }, [addForm, allServices, deviceTypes, serviceCategories, workerServices]);

    // ── Додати послугу ─────────────────────────────────────────────────────────
    const handleAddService = useCallback(async () => {
        if (!addForm.serviceId) return;
        setAddSubmitting(true);
        try {
            await onAddService(Number(addForm.serviceId));
            setAddForm(EMPTY_ADD_SERVICE);
        } finally {
            setAddSubmitting(false);
        }
    }, [addForm.serviceId, onAddService]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Paper sx={{ p: 1.5, mb: 1, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.15)' : '#E3F2FD', border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(100, 170, 235, 0.4)' : '1px solid #BBDEFB', boxShadow: '0 2px 6px rgba(0,0,0,0.10)', borderRadius: 1.5 }}>
            {/* Read-only персональні дані */}
            <Box sx={{ mb: 1.5 }}>
                <Typography fontWeight={700}>{worker.workerFullName || worker.fullName || '—'}</Typography>
                <Typography variant="body2"><b>{L.POSITION_PREFIX}</b> {worker.positionName || '—'}</Typography>
                <Typography variant="body2">
                    <b>{L.PHONE_PREFIX}</b> {worker.workerPhoneNumber || worker.phoneNumber || '—'}
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    <b>Email:</b> {worker.workerEmail || worker.email || '—'}
                </Typography>
            </Box>

            {/* Послуги */}
            <Divider sx={{ mb: 1 }}>{L.SERVICES_DIVIDER}</Divider>

            {loadingServices ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}><CircularProgress size={22} /></Box>
            ) : (
                <>
                    {workerServices.map((ws) => (
                        <Box key={ws.workerServiceId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 1, px: 1.2, py: 0.5, mb: 0.6, border: '1px solid', borderColor: 'divider' }}>
                            <Box>
                                <Typography variant="body2" fontWeight={600}>{ws.serviceName}</Typography>
                                <Typography variant="caption" color="text.secondary">{L.DEVICE_TYPE_PREFIX} {ws.deviceTypeName}</Typography>
                            </Box>
                            <Tooltip title={L.REMOVE_SERVICE_TOOLTIP}>
                                <IconButton size="small" color="error" onClick={() => onRemoveService(ws.workerServiceId)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    ))}

                    {/* Форма додавання */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1, mt: 1 }}>
                        <TextField select size="small" label={L.DEVICE_TYPE_LABEL} value={addForm.deviceTypeId} onChange={handleAddFormChange('deviceTypeId')}>
                            <MenuItem value="">{L.ALL_TYPES}</MenuItem>
                            {deviceTypes.map((dt) => <MenuItem key={dt.id} value={dt.id}>{dt.name}</MenuItem>)}
                        </TextField>
                        <TextField select size="small" label={L.SERVICE_CATEGORY_LABEL} value={addForm.categoryId} onChange={handleAddFormChange('categoryId')}>
                            <MenuItem value="">{L.ALL_CATEGORIES}</MenuItem>
                            {serviceCategories.map((sc) => <MenuItem key={sc.id} value={sc.id}>{sc.name}</MenuItem>)}
                        </TextField>
                        <TextField select size="small" label={L.SERVICE_LABEL} value={addForm.serviceId} onChange={handleAddFormChange('serviceId')} disabled={filteredServices.length === 0}>
                            <MenuItem value="">{L.SELECT_SERVICE}</MenuItem>
                            {filteredServices.map((s) => <MenuItem key={s.serviceId} value={s.serviceId}>{s.serviceName}</MenuItem>)}
                        </TextField>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 0.8 }}>
                        <Button size="small" color="inherit" onClick={() => setAddForm(EMPTY_ADD_SERVICE)}>{L.CLEAR_SELECTION}</Button>
                        <Button size="small" variant="contained" color="secondary"
                            disabled={!addForm.serviceId || addSubmitting} onClick={handleAddService}
                            startIcon={addSubmitting ? <CircularProgress size={14} color="inherit" /> : null}>
                            {L.ADD_SERVICE_BUTTON}
                        </Button>
                    </Box>
                </>
            )}

            {/* Закрити */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" onClick={onCancel}>{L.DONE_BUTTON}</Button>
            </Box>
        </Paper>
    );
});
WorkerEditCard.displayName = 'WorkerEditCard';

// ─── BranchesPanel — головний компонент ──────────────────────────────────────

const BranchesPanel = () => {
    const { labels } = useLanguage();
    const L = labels.management.BRANCHES;
    // ── Дані ──────────────────────────────────────────────────────────────────
    const [branches, setBranches]                   = useState([]);
    const [workers, setWorkers]                     = useState([]);
    const [positions, setPositions]                 = useState([]);
    const [roles, setRoles]                         = useState([]);
    const [deviceTypes, setDeviceTypes]             = useState([]);
    const [serviceCategories, setServiceCategories] = useState([]);
    const [allServices, setAllServices]             = useState([]);
    const [loading, setLoading]                     = useState(false);

    // ── Акордеон ──────────────────────────────────────────────────────────────
    const [expandedBranchId, setExpandedBranchId] = useState(null);

    // ── Редагування працівника (тільки ID та сервіси — без форми!) ────────────
    const [editingWorkerId, setEditingWorkerId]       = useState(null);
    const [workerServicesMap, setWorkerServicesMap]   = useState({});
    const [loadingWorkerServices, setLoadingWorkerServices] = useState(false);
    const [workerSaveSubmitting, setWorkerSaveSubmitting]   = useState(false);

    // ── Переміщення працівника ─────────────────────────────────────────────────
    const [movingWorkerId, setMovingWorkerId]       = useState(null);
    const [moveSelectedBranch, setMoveSelectedBranch] = useState(null);
    const [moveSubmitting, setMoveSubmitting]       = useState(false);

    // ── Створення відділення ───────────────────────────────────────────────────
    const [createFormOpen, setCreateFormOpen]             = useState(false);
    const [createBranchForm, setCreateBranchForm]         = useState(EMPTY_CREATE_BRANCH);
    const [createBranchEmailError, setCreateBranchEmailError] = useState('');
    const [createBranchSubmitting, setCreateBranchSubmitting] = useState(false);

    // ── Видалення відділення ───────────────────────────────────────────────────
    const [deleteBranchTarget, setDeleteBranchTarget]   = useState(null); // branch object | null
    const [deleteBranchLoading, setDeleteBranchLoading] = useState(false);

    // ── Snackbar ───────────────────────────────────────────────────────────────
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const showSnack = useCallback(
        (message, severity = 'success') => setSnackbar({ open: true, message, severity }),
        [],
    );

    // ── Початкове завантаження ────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const [br, wk, pos, ro, dt, sc, svc] = await Promise.all([
                    fetchBranches(),
                    fetchWorkers(),
                    fetchPositions(),
                    fetchRoles(),
                    fetchDictionaryItems('device-types'),
                    fetchDictionaryItems('service-categories'),
                    fetchRepairServices(),
                ]);
                if (cancelled) return;
                setBranches(br);
                setWorkers(wk);
                setPositions(pos);
                setRoles(ro);
                setDeviceTypes(dt);
                setServiceCategories(sc);
                setAllServices(svc);
            } catch {
                if (!cancelled) setSnackbar({ open: true, message: L.LOAD_FAILED, severity: 'error' });
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    // ── Завантаження послуг при відкритті форми редагування ──────────────────
    useEffect(() => {
        if (!editingWorkerId) return;
        let cancelled = false;
        setLoadingWorkerServices(true);
        fetchWorkerServices(editingWorkerId)
            .then((data) => { if (!cancelled) setWorkerServicesMap((prev) => ({ ...prev, [editingWorkerId]: data })); })
            .catch(() => { if (!cancelled) showSnack(L.LOAD_WORKER_SERVICES_FAILED, 'error'); })
            .finally(() => { if (!cancelled) setLoadingWorkerServices(false); });
        return () => { cancelled = true; };
    }, [editingWorkerId, showSnack]);

    // ── Хендлери редагування ──────────────────────────────────────────────────
    const startEditWorker = useCallback((worker) => {
        setEditingWorkerId(worker.id);
        setMovingWorkerId(null);
        setMoveSelectedBranch(null);
    }, []);

    const cancelEditWorker = useCallback(() => setEditingWorkerId(null), []);

    /** Викликається з WorkerEditCard при натисканні "Зберегти" */
    const handleSaveWorker = useCallback(async (formData) => {
        if (!editingWorkerId) return;
        setWorkerSaveSubmitting(true);
        try {
            await updateUser(editingWorkerId, {
                fullName:    formData.fullName.trim(),
                phoneNumber: normalizePhoneForApi(formData.phoneNumber),
                email:       formData.email.trim() || null,
                positionId:  formData.positionId ? Number(formData.positionId) : null,
                branchId:    Number(formData.branchId),
                roleId:      Number(formData.roleId),
            });
            showSnack(L.WORKER_SAVED);
            cancelEditWorker();
            setWorkers(await fetchWorkers());
        } catch (e) {
            showSnack(getApiErrorMessage(e, L.WORKER_SAVE_FAILED), 'error');
        } finally {
            setWorkerSaveSubmitting(false);
        }
    }, [editingWorkerId, showSnack, cancelEditWorker]);

    // ── Хендлери послуг ───────────────────────────────────────────────────────
    const handleRemoveWorkerService = useCallback(async (workerServiceId) => {
        if (!editingWorkerId) return;
        try {
            await removeWorkerService(editingWorkerId, workerServiceId);
            setWorkerServicesMap((prev) => ({
                ...prev,
                [editingWorkerId]: (prev[editingWorkerId] ?? []).filter((ws) => ws.workerServiceId !== workerServiceId),
            }));
        } catch (e) {
            showSnack(getApiErrorMessage(e, L.REMOVE_SERVICE_FAILED), 'error');
        }
    }, [editingWorkerId, showSnack]);

    /** Повертає Promise — WorkerEditCard самостійно скидає свою форму після успіху */
    const handleAddWorkerService = useCallback(async (serviceId) => {
        if (!editingWorkerId) return;
        const ws = await addWorkerService(editingWorkerId, serviceId);
        setWorkerServicesMap((prev) => ({
            ...prev,
            [editingWorkerId]: [...(prev[editingWorkerId] ?? []), ws],
        }));
    }, [editingWorkerId]);

    // ── Переміщення ───────────────────────────────────────────────────────────
    const startMoveWorker = useCallback((worker) => {
        setMovingWorkerId(worker.id);
        setMoveSelectedBranch(null);
        setEditingWorkerId(null);
    }, []);

    const cancelMoveWorker = useCallback(() => {
        setMovingWorkerId(null);
        setMoveSelectedBranch(null);
    }, []);

    const handleMoveWorker = useCallback(async (workerId) => {
        if (!moveSelectedBranch) return;
        setMoveSubmitting(true);
        try {
            await moveWorkerToBranch(workerId, moveSelectedBranch.id);
            showSnack(L.WORKER_MOVED);
            cancelMoveWorker();
            setWorkers(await fetchWorkers());
        } catch (e) {
            showSnack(getApiErrorMessage(e, L.WORKER_MOVE_FAILED), 'error');
        } finally {
            setMoveSubmitting(false);
        }
    }, [moveSelectedBranch, showSnack, cancelMoveWorker]);

    // ── Створення відділення ──────────────────────────────────────────────────
    const handleCreateBranch = useCallback(async () => {
        if (!createBranchForm.address.trim()) return;
        const emailErr = validateEmail(createBranchForm.email);
        if (emailErr) { setCreateBranchEmailError(emailErr); return; }
        setCreateBranchSubmitting(true);
        try {
            await createBranch({
                address:     createBranchForm.address.trim(),
                phoneNumber: normalizePhoneForApi(createBranchForm.phoneNumber) || null,
                email:       createBranchForm.email.trim() || null,
            });
            showSnack(L.BRANCH_CREATED);
            setCreateBranchForm(EMPTY_CREATE_BRANCH);
            setCreateBranchEmailError('');
            setCreateFormOpen(false);
            setBranches(await fetchBranches());
        } catch (e) {
            showSnack(getApiErrorMessage(e, L.BRANCH_CREATE_FAILED), 'error');
        } finally {
            setCreateBranchSubmitting(false);
        }
    }, [createBranchForm, showSnack]);

    // ── Видалення відділення: підтвердження ───────────────────────────────────
    const handleConfirmDeleteBranch = useCallback(async () => {
        if (!deleteBranchTarget) return;
        setDeleteBranchLoading(true);
        try {
            await deleteBranch(deleteBranchTarget.id);
            showSnack(L.BRANCH_DELETED);
            setDeleteBranchTarget(null);
            if (expandedBranchId === deleteBranchTarget.id) setExpandedBranchId(null);
            setBranches(await fetchBranches());
        } catch (e) {
            showSnack(getApiErrorMessage(e, L.BRANCH_DELETE_FAILED), 'error');
            setDeleteBranchTarget(null);
        } finally {
            setDeleteBranchLoading(false);
        }
    }, [deleteBranchTarget, expandedBranchId, showSnack]);

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            {/* ── Кнопка + форма створення відділення (зверху) ── */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    onClick={() => {
                        setCreateFormOpen((p) => !p);
                        setCreateBranchForm(EMPTY_CREATE_BRANCH);
                        setCreateBranchEmailError('');
                    }}
                >
                    {createFormOpen ? L.CANCEL_BUTTON : L.CREATE_BRANCH_BUTTON}
                </Button>
            </Box>

            {createFormOpen && (
                <Box sx={{ mb: 2.5, p: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184,116,206,0.1)' : '#EBDCF1', borderRadius: 1.5, border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(184,116,206,0.2)' : '1px solid #d9c4e4' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 1.5 }}>
                        <TextField
                            label={L.BRANCH_ADDRESS_LABEL} size="small" placeholder={L.BRANCH_ADDRESS_PLACEHOLDER}
                            helperText={L.BRANCH_ADDRESS_HELPER} value={createBranchForm.address}
                            onChange={(e) => setCreateBranchForm((p) => ({ ...p, address: e.target.value }))}
                            inputProps={{ maxLength: 100 }}
                        />
                        <TextField
                            label={L.BRANCH_EMAIL_LABEL} size="small" placeholder={L.BRANCH_EMAIL_PLACEHOLDER}
                            value={createBranchForm.email}
                            error={Boolean(createBranchEmailError)}
                            helperText={createBranchEmailError || L.BRANCH_EMAIL_HELPER}
                            inputProps={{ maxLength: 70 }}
                            onChange={(e) => {
                                const v = e.target.value;
                                setCreateBranchForm((p) => ({ ...p, email: v }));
                                setCreateBranchEmailError(validateEmail(v));
                            }}
                        />
                        <TextField
                            label={L.BRANCH_PHONE_LABEL} size="small" placeholder="+38 (___) ___-__-__"
                            helperText={L.BRANCH_PHONE_HELPER} value={createBranchForm.phoneNumber}
                            onChange={(e) => setCreateBranchForm((p) => ({ ...p, phoneNumber: formatPhoneNumberInput(e.target.value) }))}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            disabled={!createBranchForm.address.trim() || createBranchSubmitting}
                            onClick={handleCreateBranch}
                            startIcon={createBranchSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                        >
                            {L.CREATE_BRANCH_BUTTON}
                        </Button>
                    </Box>
                </Box>
            )}

            {branches.length === 0 && !createFormOpen && (
                <Alert severity="info" sx={{ mb: 2 }}>{L.NO_BRANCHES}</Alert>
            )}

            {branches.map((branch) => {
                const branchWorkers = workers.filter((w) => w.branchId === branch.id);

                return (
                    <Accordion
                        key={branch.id}
                        expanded={expandedBranchId === branch.id}
                        onChange={() => setExpandedBranchId((prev) => (prev === branch.id ? null : branch.id))}
                        sx={{ mb: 0.5, '&:before': { display: 'none' } }}
                        disableGutters
                        elevation={1}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{
                                px: 2.5,
                                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184,116,206,0.1)' : '#EBDCF1',
                                '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184,116,206,0.15)' : '#e2d0ee' },
                                borderRadius: expandedBranchId === branch.id ? '4px 4px 0 0' : 1,
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <Typography fontWeight={700} sx={{ fontSize: '1rem' }}>{branch.address}</Typography>
                                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        <b>{L.CONTACT_NUMBER_PREFIX}</b> {branch.phoneNumber || '—'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <b>Email:</b> {branch.email || '—'}
                                    </Typography>
                                </Box>
                            </Box>
                        </AccordionSummary>

                        <AccordionDetails sx={{ px: 2.5, pb: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184,116,206,0.05)' : '#EBDCF1' }}>
                            <Divider sx={{ mb: 1.5 }}>{L.WORKERS_DIVIDER}</Divider>

                            {branchWorkers.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                                    {L.NO_WORKERS}
                                </Typography>
                            )}

                            {branchWorkers.map((worker) => (
                                editingWorkerId === worker.id ? (
                                    <WorkerEditCard
                                        key={worker.id}
                                        worker={worker}
                                        positions={positions}
                                        roles={roles}
                                        workerServices={workerServicesMap[worker.id] ?? []}
                                        loadingServices={loadingWorkerServices}
                                        onRemoveService={handleRemoveWorkerService}
                                        allServices={allServices}
                                        deviceTypes={deviceTypes}
                                        serviceCategories={serviceCategories}
                                        onAddService={handleAddWorkerService}
                                        saveSubmitting={workerSaveSubmitting}
                                        onSave={handleSaveWorker}
                                        onCancel={cancelEditWorker}
                                        L={L}
                                    />
                                ) : (
                                    <WorkerViewCard
                                        key={worker.id}
                                        worker={worker}
                                        onEdit={startEditWorker}
                                        onStartMove={startMoveWorker}
                                        movingWorkerId={movingWorkerId}
                                        branches={branches}
                                        moveSelectedBranch={moveSelectedBranch}
                                        onMoveSelectedBranchChange={setMoveSelectedBranch}
                                        onConfirmMove={handleMoveWorker}
                                        moveSubmitting={moveSubmitting}
                                        onCancelMove={cancelMoveWorker}
                                        L={L}
                                    />
                                )
                            ))}

                            {/* Видалення відділення */}
                            <Divider sx={{ mt: 2, mb: 1.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<DeleteOutlineIcon />}
                                    onClick={() => setDeleteBranchTarget(branch)}
                                >
                                    {L.DELETE_BRANCH_BUTTON}
                                </Button>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                );
            })}

            {/* Діалог підтвердження видалення відділення */}
            <Dialog
                open={Boolean(deleteBranchTarget)}
                onClose={() => !deleteBranchLoading && setDeleteBranchTarget(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle fontWeight={700} sx={{ pb: 1, color: 'text.primary' }}>
                    {L.CONFIRM_DELETE_TITLE}
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning">
                        {L.DELETE_BRANCH_CONFIRM_PREFIX}
                        <Typography component="span" fontWeight={700}>
                            "{deleteBranchTarget?.address}"
                        </Typography>
                        {L.DELETE_BRANCH_CONFIRM_SUFFIX}
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setDeleteBranchTarget(null)}
                        disabled={deleteBranchLoading}
                    >
                        {L.CANCEL_BUTTON}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDeleteBranch}
                        disabled={deleteBranchLoading}
                        startIcon={deleteBranchLoading ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {L.DELETE_CONFIRM_BUTTON}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled"
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BranchesPanel;
