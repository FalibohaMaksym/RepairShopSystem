import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Snackbar,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import {
    fetchRepairServices,
    searchRepairServices,
    createRepairService,
    updateRepairService,
    deleteRepairService,
    fetchDictionaryItems,
} from '../../../services/dataManagementService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { useLanguage } from '../../../app/i18n/LanguageContext';

// ─── Price formatter ───────────────────────────────────────────────────────────

const fmtPrice = (v, lang) =>
    v == null
        ? '—'
        : Number(v).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (lang === 'ua' ? ' грн.' : ' UAH');

// ─── Shared form fields (static — no state here) ──────────────────────────────

const handlePriceChange = (onChange) => (e) => {
    // decimal(6,2): до 4 цифр до крапки, до 2 після → max 9999.99
    const raw = e.target.value.replace(',', '.');
    if (/^(\d{0,4}(\.\d{0,2})?)?$/.test(raw)) {
        onChange('estimatedPrice')({ target: { value: raw } });
    }
};

const ServiceFields = ({ form, onChange, categories, complexities, deviceTypes, lang }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.2, mb: 1.5 }}>
        <TextField
            label={lang === 'ua' ? 'Назва послуги' : 'Service name'} size="small" placeholder={lang === 'ua' ? 'Введіть назву послуги' : 'Enter service name'}
            helperText={lang === 'ua' ? 'Підтримується текст' : 'Text is supported'} value={form.serviceName}
            onChange={onChange('serviceName')} inputProps={{ maxLength: 50 }}
        />
        <TextField label={lang === 'ua' ? 'Складність послуги' : 'Service complexity'} size="small" select value={form.complexityId} onChange={onChange('complexityId')}>
            <MenuItem value="">{lang === 'ua' ? 'Складність послуги' : 'Service complexity'}</MenuItem>
            {complexities.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField
            label={lang === 'ua' ? 'Ціна послуги' : 'Service price'} size="small" placeholder="0.00"
            helperText={lang === 'ua' ? 'Від 0.01 до 9999.99' : 'From 0.01 to 9999.99'} value={form.estimatedPrice}
            onChange={handlePriceChange(onChange)}
            inputProps={{ inputMode: 'decimal' }}
        />
        <TextField label={lang === 'ua' ? 'Категорія послуги' : 'Service category'} size="small" select value={form.categoryId} onChange={onChange('categoryId')}>
            <MenuItem value="">{lang === 'ua' ? 'Категорія послуги' : 'Service category'}</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField label={lang === 'ua' ? 'Тип пристрою' : 'Device type'} size="small" select value={form.deviceTypeId} onChange={onChange('deviceTypeId')}>
            <MenuItem value="">{lang === 'ua' ? 'Тип пристрою' : 'Device type'}</MenuItem>
            {deviceTypes.map((dt) => <MenuItem key={dt.id} value={dt.id}>{dt.name}</MenuItem>)}
        </TextField>
    </Box>
);

// ─── ServiceEditForm — локальний стан, батько не ре-рендериться при друку ─────

const ServiceEditForm = React.memo(({
    service, categories, complexities, deviceTypes,
    onSave, saveSubmitting, onCancel,
    lang,
}) => {
    const [form, setForm] = useState(() => {
        const categoryId   = categories.find((c)  => c.name  === service.categoryName)?.id   ?? '';
        const complexityId = complexities.find((c) => c.name  === service.complexityValue)?.id ?? '';
        const deviceTypeId = deviceTypes.find((dt) => dt.name === service.deviceTypeName)?.id  ?? '';
        return {
            serviceName:    service.serviceName,
            estimatedPrice: String(service.estimatedPrice ?? ''),
            categoryId:     String(categoryId),
            complexityId:   String(complexityId),
            deviceTypeId:   String(deviceTypeId),
        };
    });

    const handleChange = useCallback((field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    }, []);

    const isValid = form.serviceName.trim() && parseFloat(form.estimatedPrice) >= 0.01 && form.categoryId && form.complexityId && form.deviceTypeId;

    return (
        <Box sx={{ p: 1.5, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184,116,206,0.1)' : '#EBDCF1', borderRadius: 1.5, border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(184,116,206,0.2)' : '1px solid #d9c4e4' }}>
            <ServiceFields form={form} onChange={handleChange} categories={categories} complexities={complexities} deviceTypes={deviceTypes} lang={lang} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" onClick={onCancel}>{lang === 'ua' ? 'Скасувати' : 'Cancel'}</Button>
                <Button variant="contained" disabled={!isValid || saveSubmitting} onClick={() => onSave(form)}
                    startIcon={saveSubmitting ? <CircularProgress size={16} color="inherit" /> : null}>
                    Зберегти
                </Button>
            </Box>
        </Box>
    );
});
ServiceEditForm.displayName = 'ServiceEditForm';

// ─── ServiceCreateForm — окремий локальний стан ───────────────────────────────

const EMPTY_FORM = { serviceName: '', estimatedPrice: '', categoryId: '', complexityId: '', deviceTypeId: '' };

const ServiceCreateForm = React.memo(({ categories, complexities, deviceTypes, onSave, saving, onCancel, lang }) => {
    const [form, setForm] = useState(EMPTY_FORM);

    const handleChange = useCallback((field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    }, []);

    const isValid = form.serviceName.trim() && parseFloat(form.estimatedPrice) >= 0.01 && form.categoryId && form.complexityId && form.deviceTypeId;

    const handleSave = useCallback(async () => {
        if (!isValid) return;
        await onSave(form);
        setForm(EMPTY_FORM);
    }, [form, isValid, onSave]);

    return (
        <Box sx={{ p: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184,116,206,0.1)' : '#EBDCF1', borderRadius: 1.5, border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(184,116,206,0.2)' : '1px solid #d9c4e4' }}>
            <ServiceFields form={form} onChange={handleChange} categories={categories} complexities={complexities} deviceTypes={deviceTypes} lang={lang} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" onClick={onCancel} disabled={saving}>
                    Скасувати
                </Button>
                <Button variant="contained" disabled={!isValid || saving} onClick={handleSave}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
                    Створити послугу
                </Button>
            </Box>
        </Box>
    );
});
ServiceCreateForm.displayName = 'ServiceCreateForm';

// ─── ServiceRow — view mode, React.memo ───────────────────────────────────────

const ServiceRow = React.memo(({ service, onEdit, onDelete, deleting, lang }) => (
    <Box sx={{ py: 1.2, px: 1.5 }}>
        <Typography fontWeight={700} sx={{ mb: 0.3 }}>{service.serviceName}</Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
                <b>{lang === 'ua' ? 'Категорія послуги:' : 'Service category:'}</b> {service.categoryName}
                &nbsp;&nbsp;
                <b>{lang === 'ua' ? 'Складність:' : 'Complexity:'}</b> {service.complexityValue}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
                <Tooltip title={lang === 'ua' ? 'Редагувати' : 'Edit'}>
                    <IconButton size="small" onClick={() => onEdit(service)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={lang === 'ua' ? 'Видалити' : 'Delete'}>
                    <span>
                        <IconButton size="small" color="error" onClick={() => onDelete(service)} disabled={deleting}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
                <b>{lang === 'ua' ? 'Проводиться для:' : 'Performed for:'}</b> {service.deviceTypeName}
            </Typography>
            <Typography variant="body2" fontWeight={500} sx={{ flexShrink: 0, ml: 1 }}>
                {lang === 'ua' ? 'Ціна: ' : 'Price: '}{fmtPrice(service.estimatedPrice, lang)}
            </Typography>
        </Box>
    </Box>
));
ServiceRow.displayName = 'ServiceRow';

// ─── Main Component ────────────────────────────────────────────────────────────

const ServicesPanel = () => {
    const { lang } = useLanguage();
    const [services, setServices]         = useState([]);
    const [categories, setCategories]     = useState([]);
    const [complexities, setComplexities] = useState([]);
    const [deviceTypes, setDeviceTypes]   = useState([]);
    const [loading, setLoading]           = useState(false);
    const [searchQuery, setSearchQuery]   = useState('');

    // Батько зберігає лише ID редагованої послуги та стани сабміту
    const [createFormOpen, setCreateFormOpen]         = useState(false);
    const [editingServiceId, setEditingServiceId]     = useState(null);
    const [editSubmitting, setEditSubmitting]         = useState(false);
    const [createSubmitting, setCreateSubmitting]     = useState(false);
    const [deleteTarget, setDeleteTarget]             = useState(null);   // service object | null
    const [deleteLoading, setDeleteLoading]           = useState(false);
    const [deletingServiceId, setDeletingServiceId]   = useState(null);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const showSnack = useCallback(
        (message, severity = 'success') => setSnackbar({ open: true, message, severity }),
        [],
    );

    // ── Завантаження довідників (одноразово) ──────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        Promise.all([
            fetchDictionaryItems('service-categories'),
            fetchDictionaryItems('service-complexities'),
            fetchDictionaryItems('device-types'),
        ]).then(([cat, comp, dt]) => {
            if (!cancelled) { setCategories(cat); setComplexities(comp); setDeviceTypes(dt); }
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

    // ── Завантаження / пошук послуг (debounced) ───────────────────────────────
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const data = searchQuery.trim()
                    ? await searchRepairServices(searchQuery.trim())
                    : await fetchRepairServices();
                if (!cancelled) setServices(data);
            } catch {
                if (!cancelled) showSnack(lang === 'ua' ? 'Не вдалося завантажити послуги.' : 'Failed to load services.', 'error');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 300);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [searchQuery, showSnack]);

    // ── Зберегти редагування (formData приходить з ServiceEditForm) ───────────
    const handleSaveEdit = useCallback(async (formData) => {
        if (!editingServiceId) return;
        setEditSubmitting(true);
        try {
            await updateRepairService(editingServiceId, {
                serviceName:    formData.serviceName.trim(),
                estimatedPrice: parseFloat(formData.estimatedPrice),
                categoryId:     Number(formData.categoryId),
                complexityId:   Number(formData.complexityId),
                deviceTypeId:   Number(formData.deviceTypeId),
            });
            showSnack(lang === 'ua' ? 'Послугу оновлено.' : 'Service updated.');
            setEditingServiceId(null);
            setServices(await fetchRepairServices());
        } catch (e) {
            showSnack(getApiErrorMessage(e, lang === 'ua' ? 'Не вдалося оновити послугу.' : 'Failed to update service.'), 'error');
        } finally {
            setEditSubmitting(false);
        }
    }, [editingServiceId, showSnack]);

    // ── Створити (formData приходить з ServiceCreateForm) ─────────────────────
    const handleCreate = useCallback(async (formData) => {
        setCreateSubmitting(true);
        try {
            await createRepairService({
                serviceName:    formData.serviceName.trim(),
                estimatedPrice: parseFloat(formData.estimatedPrice),
                categoryId:     Number(formData.categoryId),
                complexityId:   Number(formData.complexityId),
                deviceTypeId:   Number(formData.deviceTypeId),
            });
            showSnack(lang === 'ua' ? 'Послугу створено.' : 'Service created.');
            setCreateFormOpen(false);
            setServices(await fetchRepairServices());
        } catch (e) {
            showSnack(getApiErrorMessage(e, lang === 'ua' ? 'Не вдалося створити послугу.' : 'Failed to create service.'), 'error');
            throw e; // щоб ServiceCreateForm не скидав форму при помилці
        } finally {
            setCreateSubmitting(false);
        }
    }, [showSnack]);

    // ── Видалити: відкрити діалог ─────────────────────────────────────────────
    const handleDelete = useCallback((service) => setDeleteTarget(service), []);

    // ── Видалити: підтвердження з діалогу ─────────────────────────────────────
    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        setDeletingServiceId(deleteTarget.serviceId);
        try {
            await deleteRepairService(deleteTarget.serviceId);
            showSnack(lang === 'ua' ? 'Послугу видалено.' : 'Service deleted.');
            setServices((prev) => prev.filter((s) => s.serviceId !== deleteTarget.serviceId));
            setDeleteTarget(null);
        } catch (e) {
            showSnack(getApiErrorMessage(e, lang === 'ua' ? 'Не вдалося видалити послугу.' : 'Failed to delete service.'), 'error');
            setDeleteTarget(null);
        } finally {
            setDeleteLoading(false);
            setDeletingServiceId(null);
        }
    }, [deleteTarget, showSnack]);

    const startEdit   = useCallback((service) => setEditingServiceId(service.serviceId), []);
    const cancelEdit  = useCallback(() => setEditingServiceId(null), []);

    const handleCancelCreate = useCallback(() => setCreateFormOpen(false), []);
    const toggleCreateForm   = useCallback(() => setCreateFormOpen((v) => !v), []);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Box>
            {/* Верхній рядок: кнопка створення */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={toggleCreateForm}
                >
                    {createFormOpen ? (lang === 'ua' ? 'Сховати форму' : 'Hide form') : (lang === 'ua' ? 'Створити послугу' : 'Create service')}
                </Button>
            </Box>

            {/* Форма створення (колапсуюча) */}
            <Collapse in={createFormOpen} unmountOnExit>
                <Box sx={{ mb: 2 }}>
                    <ServiceCreateForm
                        categories={categories}
                        complexities={complexities}
                        deviceTypes={deviceTypes}
                        onSave={handleCreate}
                        saving={createSubmitting}
                        onCancel={handleCancelCreate}
                        lang={lang}
                    />
                </Box>
            </Collapse>

            {/* Пошук */}
            <TextField
                fullWidth size="small" placeholder={lang === 'ua' ? 'Пошук послуги' : 'Search service'}
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2, bgcolor: 'background.paper' }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <SearchIcon color="action" fontSize="small" />
                        </InputAdornment>
                    ),
                }}
            />

            {/* Список */}
            <Paper sx={{ mb: 2.5, overflow: 'hidden', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.05)' : '#E3F2FD' }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={28} />
                    </Box>
                )}

                {!loading && services.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                        Послуг не знайдено
                    </Typography>
                )}

                {services.map((service, idx) => (
                    <React.Fragment key={service.serviceId}>
                        {idx > 0 && <Divider />}
                        {editingServiceId === service.serviceId ? (
                            <Box sx={{ p: 1.5 }}>
                                <ServiceEditForm
                                    service={service}
                                    categories={categories}
                                    complexities={complexities}
                                    deviceTypes={deviceTypes}
                                    onSave={handleSaveEdit}
                                    saveSubmitting={editSubmitting}
                                    onCancel={cancelEdit}
                                    lang={lang}
                                />
                            </Box>
                        ) : (
                            <ServiceRow
                                service={service}
                                onEdit={startEdit}
                                onDelete={handleDelete}
                                deleting={deletingServiceId === service.serviceId}
                                lang={lang}
                            />
                        )}
                    </React.Fragment>
                ))}
            </Paper>

            {/* Діалог підтвердження видалення */}
            <Dialog
                open={Boolean(deleteTarget)}
                onClose={() => !deleteLoading && setDeleteTarget(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle fontWeight={700} sx={{ pb: 1, color: 'text.primary' }}>
                    {lang === 'ua' ? 'Підтвердити видалення' : 'Confirm deletion'}
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning">
                        {lang === 'ua' ? 'Видалити послугу ' : 'Delete service '}
                        <Typography component="span" fontWeight={700}>
                            "{deleteTarget?.serviceName}"
                        </Typography>
                        {lang === 'ua' ? '? Цю дію не можна скасувати.' : '? This action cannot be undone.'}
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setDeleteTarget(null)}
                        disabled={deleteLoading}
                    >
                        Скасувати
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        Видалити
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open} autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled"
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ServicesPanel;
