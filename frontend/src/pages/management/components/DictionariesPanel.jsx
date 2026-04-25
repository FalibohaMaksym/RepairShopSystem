import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
    fetchDictionaryItems,
    createDictionaryItem,
    updateDictionaryItem,
    deleteDictionaryItem,
} from '../../../services/dataManagementService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { useLanguage } from '../../../app/i18n/LanguageContext';

// ─── Dictionary config ─────────────────────────────────────────────────────────

const getDictOptions = (lang) => [
    { key: 'device-types',          label: lang === 'ua' ? 'Типи пристроїв' : 'Device types',            type: 'simple', maxLength: 30 },
    { key: 'device-purposes',       label: lang === 'ua' ? 'Призначення пристроїв' : 'Device purposes',   type: 'simple', maxLength: 20 },
    { key: 'service-categories',    label: lang === 'ua' ? 'Категорії послуг' : 'Service categories',     type: 'simple', maxLength: 30 },
    { key: 'service-complexities',  label: lang === 'ua' ? 'Складності послуг' : 'Service complexities',  type: 'simple', maxLength: 15 },
    { key: 'component-categories',  label: lang === 'ua' ? 'Категорії комплектуючих' : 'Component categories', type: 'simple', maxLength: 20 },
    { key: 'producers',             label: lang === 'ua' ? 'Виробники' : 'Producers',                    type: 'simple', maxLength: 30 },
    { key: 'positions',             label: lang === 'ua' ? 'Посади' : 'Positions',                       type: 'simple', maxLength: 30 },
];

const EMPTY_SIMPLE = { name: '' };

// ─── Item helpers ──────────────────────────────────────────────────────────────

const normalizeItem = (item) => ({ id: item.id, name: item.name ?? '' });

const isFormValid = (form) => form.name?.trim().length > 0;

// ─── Row components ────────────────────────────────────────────────────────────

/** View-mode row for simple dictionary */
const SimpleViewRow = ({ item, onEdit, onDelete, lang }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ flex: 1, fontSize: '0.9rem' }}>{item.name}</Typography>
        <Tooltip title={lang === 'ua' ? 'Редагувати' : 'Edit'}>
            <IconButton size="small" onClick={() => onEdit(item)}>
                <EditIcon fontSize="small" />
            </IconButton>
        </Tooltip>
        <Tooltip title={lang === 'ua' ? 'Видалити' : 'Delete'}>
            <IconButton size="small" color="error" onClick={() => onDelete(item)}>
                <DeleteIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    </Box>
);

/** Edit-mode row for simple dictionary */
const SimpleEditRow = ({ form, onChange, onSave, onCancel, saving, maxLength = 70, lang }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
            size="small"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder={lang === 'ua' ? 'Назва' : 'Name'}
            helperText={lang === 'ua' ? `max ${maxLength} симв.` : `max ${maxLength} chars`}
            sx={{ flex: 1 }}
            inputProps={{ maxLength }}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        />
        <Tooltip title={lang === 'ua' ? 'Зберегти' : 'Save'}>
            <span>
                <IconButton size="small" color="primary" onClick={onSave} disabled={!form.name?.trim() || saving}>
                    {saving ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                </IconButton>
            </span>
        </Tooltip>
        <Tooltip title={lang === 'ua' ? 'Скасувати' : 'Cancel'}>
            <IconButton size="small" onClick={onCancel}><CloseIcon fontSize="small" /></IconButton>
        </Tooltip>
    </Box>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const DictionariesPanel = () => {
    const { lang } = useLanguage();
    const dictOptions = getDictOptions(lang);
    const [selectedKey, setSelectedKey] = useState('device-types');
    const selectedConfig = dictOptions.find((d) => d.key === selectedKey);

    const [items, setItems]             = useState([]);
    const [loading, setLoading]         = useState(false);

    // Inline editing state — id or 'new'
    const [editingId, setEditingId]     = useState(null);
    const [editForm, setEditForm]       = useState(null);
    const [editSaving, setEditSaving]   = useState(false);

    // New-row form (appears at top when "Додати" clicked)
    const [newForm, setNewForm]         = useState(null);
    const [newSaving, setNewSaving]     = useState(false);

    // Delete confirmation dialog
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const showSnack = useCallback((message, severity = 'success') =>
        setSnackbar({ open: true, message, severity }), []);

    // ── Load items ─────────────────────────────────────────────────────────────
    const loadItems = useCallback(async () => {
        setLoading(true);
        setEditingId(null);
        setEditForm(null);
        setNewForm(null);
        try {
            const raw = await fetchDictionaryItems(selectedKey);
            setItems(raw.map(normalizeItem));
        } catch {
            showSnack(lang === 'ua' ? 'Не вдалося завантажити дані довідника.' : 'Failed to load dictionary data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedKey, showSnack]);

    useEffect(() => { loadItems(); }, [loadItems]);

    // ── Start editing ──────────────────────────────────────────────────────────
    const startEdit = useCallback((item) => {
        setNewForm(null);
        setEditingId(item.id);
        setEditForm({ name: item.name });
    }, []);

    const cancelEdit = useCallback(() => { setEditingId(null); setEditForm(null); }, []);

    // ── Save edit ──────────────────────────────────────────────────────────────
    const handleSaveEdit = useCallback(async () => {
        if (!editingId || !editForm) return;
        setEditSaving(true);
        try {
            await updateDictionaryItem(selectedKey, editingId, editForm.name.trim());
            showSnack(lang === 'ua' ? 'Запис оновлено.' : 'Record updated.');
            cancelEdit();
            await loadItems();
        } catch (e) {
            showSnack(getApiErrorMessage(e, lang === 'ua' ? 'Не вдалося оновити запис.' : 'Failed to update record.'), 'error');
        } finally {
            setEditSaving(false);
        }
    }, [editingId, editForm, selectedKey, showSnack, cancelEdit, loadItems]);

    // ── New row ────────────────────────────────────────────────────────────────
    const openNewRow = useCallback(() => {
        setEditingId(null);
        setEditForm(null);
        setNewForm({ ...EMPTY_SIMPLE });
    }, []);

    const cancelNew = useCallback(() => setNewForm(null), []);

    const handleSaveNew = useCallback(async () => {
        if (!newForm || !isFormValid(newForm)) return;
        setNewSaving(true);
        try {
            await createDictionaryItem(selectedKey, newForm.name.trim());
            showSnack(lang === 'ua' ? 'Запис додано.' : 'Record added.');
            setNewForm(null);
            await loadItems();
        } catch (e) {
            showSnack(getApiErrorMessage(e, lang === 'ua' ? 'Не вдалося додати запис.' : 'Failed to add record.'), 'error');
        } finally {
            setNewSaving(false);
        }
    }, [newForm, selectedKey, showSnack, loadItems]);

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteDictionaryItem(selectedKey, deleteTarget.id);
            showSnack(lang === 'ua' ? 'Запис видалено.' : 'Record deleted.');
            setDeleteTarget(null);
            await loadItems();
        } catch (e) {
            showSnack(getApiErrorMessage(e, lang === 'ua' ? 'Не вдалося видалити запис.' : 'Failed to delete record.'), 'error');
            setDeleteTarget(null);
        } finally {
            setDeleteLoading(false);
        }
    }, [deleteTarget, selectedKey, showSnack, loadItems]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Box>
            {/* Dictionary selector + Add button */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2.5, flexWrap: 'wrap' }}>
                <TextField
                    select
                    size="small"
                    label={lang === 'ua' ? 'Довідник' : 'Dictionary'}
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    sx={{ minWidth: 260, bgcolor: 'background.paper' }}
                >
                    {dictOptions.map((opt) => (
                        <MenuItem key={opt.key} value={opt.key}>{opt.label}</MenuItem>
                    ))}
                </TextField>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openNewRow}
                    disabled={!!newForm}
                >
                    {lang === 'ua' ? 'Додати' : 'Add'}
                </Button>
            </Box>

            {/* Items list */}
            <Paper>
                {/* New row */}
                {newForm && (
                    <>
                        <Box sx={{ px: 2, py: 1.2 }}>
                            <SimpleEditRow
                                form={newForm}
                                onChange={setNewForm}
                                onSave={handleSaveNew}
                                onCancel={cancelNew}
                                saving={newSaving}
                                lang={lang}
                                maxLength={selectedConfig?.maxLength ?? 70}
                            />
                        </Box>
                        <Divider />
                    </>
                )}

                {/* Loading */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                )}

                {/* Empty state */}
                {!loading && items.length === 0 && !newForm && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: 'center', py: 4 }}
                    >
                        Записів не знайдено. Натисніть «Додати» для створення першого.
                    </Typography>
                )}

                {/* Items */}
                {items.map((item, idx) => (
                    <React.Fragment key={item.id}>
                        {idx > 0 && <Divider />}
                        <Box sx={{ px: 2, py: 1.2 }}>
                            {editingId === item.id ? (
                                <SimpleEditRow
                                    form={editForm}
                                    onChange={setEditForm}
                                    onSave={handleSaveEdit}
                                    onCancel={cancelEdit}
                                    saving={editSaving}
                                    lang={lang}
                                    maxLength={selectedConfig?.maxLength ?? 70}
                                />
                            ) : (
                                <SimpleViewRow
                                    item={item}
                                    onEdit={startEdit}
                                    onDelete={setDeleteTarget}
                                    lang={lang}
                                />
                            )}
                        </Box>
                    </React.Fragment>
                ))}
            </Paper>

            {/* Delete confirmation dialog */}
            <Dialog open={Boolean(deleteTarget)} onClose={() => !deleteLoading && setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700} sx={{ pb: 1, color: 'text.primary' }}>{lang === 'ua' ? 'Підтвердити видалення' : 'Confirm deletion'}</DialogTitle>
                <DialogContent>
                    <Alert severity="warning">
                        {lang === 'ua' ? 'Видалити запис ' : 'Delete record '}
                        <Typography component="span" fontWeight={700}>"{deleteTarget?.name}"</Typography>
                        {lang === 'ua' ? '? Цю дію не можна скасувати.' : '? This action cannot be undone.'}
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteTarget(null)} color="inherit">{lang === 'ua' ? 'Скасувати' : 'Cancel'}</Button>
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

            {/* Snackbar */}
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
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DictionariesPanel;
