import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,

    Select,
    Snackbar,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchMyStock } from '../../../services/stockService';
import {
    fetchComponents,
    fetchCategories,
    fetchProducers,
    fetchWarrantyObligations,
    fetchSuppliers,
    createComponent,
    createComponentOrder,
    updateComponentOrder,
    createSupplier,
    deleteSupplier,
    deleteComponent,
} from '../../../services/componentOrderService';
import { useLanguage } from '../../../app/i18n/LanguageContext';

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Парсить ціну незалежно від того, прийшла вона числом або рядком ("350.00")
const toNum = (v) => parseFloat(String(v ?? 0).replace(',', '.')) || 0;

// Дозволяє вводити лише числа з максимум 2 знаками після крапки/коми (для ціни одиниці у замовленні)
const isValidPriceInput = (v) => v === '' || /^\d*[.,]?\d{0,2}$/.test(v);

// decimal(7,2): максимум 5 цілих цифр + 2 знаки після крапки → 99 999.99
const isValidComponentPrice = (v) => v === '' || /^(\d{0,5}([.,]\d{0,2})?)?$/.test(v);
const MAX_COMPONENT_PRICE = 99999.99;

const fmtPrice = (v) =>
    toNum(v).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── StockCard ─────────────────────────────────────────────────────────────────

const StockCard = ({ item, onSelect, isSelected }) => (
    <Box
        onClick={onSelect}
        sx={{
            border: '1px solid',
            borderColor: isSelected ? '#B874CE' : 'divider',
            borderRadius: 1,
            p: '8px 10px',
            mb: 0.7,
            bgcolor: isSelected ? 'rgba(184,116,206,0.08)' : 'background.paper',
            cursor: 'pointer',
            position: 'relative',
            transition: 'border-color 0.12s, background-color 0.12s',
            '&:hover': {
                borderColor: '#B874CE',
                bgcolor: 'rgba(184,116,206,0.06)',
                '& .stock-add-icon': { opacity: 1 },
            },
        }}
    >
        {/* Line 1: name + qty badge + add icon */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.3 }}>
            <Typography
                noWrap
                sx={{ fontSize: '0.8rem', fontWeight: 600, flex: 1, lineHeight: 1.3 }}
                title={`${item.producerName ?? ''} ${item.componentModel ?? ''}`}
            >
                {item.producerName && <span style={{ color: '#5A6878' }}>{item.producerName},&nbsp;</span>}
                {item.componentModel}
            </Typography>
            <Chip
                label={item.currentQuantity}
                size="small"
                sx={{
                    height: 18,
                    fontSize: '0.68rem',
                    flexShrink: 0,
                    bgcolor: isSelected ? 'rgba(184,116,206,0.2)' : 'rgba(0,0,0,0.06)',
                    color: isSelected ? '#B874CE' : 'text.secondary',
                    '& .MuiChip-label': { px: 0.7 },
                }}
            />
            <AddIcon
                className="stock-add-icon"
                sx={{
                    fontSize: '0.95rem',
                    color: '#B874CE',
                    flexShrink: 0,
                    opacity: isSelected ? 1 : 0,
                    transition: 'opacity 0.12s',
                    mt: '1px',
                }}
            />
        </Box>
        {/* Line 2: category · price */}
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.3 }}>
            {[item.categoryName, `${fmtPrice(item.price)} грн.`].filter(Boolean).join(' · ')}
        </Typography>
    </Box>
);

// ─── OrderItemRow ──────────────────────────────────────────────────────────────

const OrderItemRow = ({ item, onEdit, onDelete, L }) => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.2,
            py: 0.8,
            border: '1px solid rgba(184,116,206,0.25)',
            borderRadius: 1,
            mb: 0.6,
            bgcolor: 'rgba(184,116,206,0.04)',
        }}
    >
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3 }}>
                {[item.component.producerName, item.component.name].filter(Boolean).join(', ')}
            </Typography>
            <Typography sx={{ fontSize: '0.73rem', color: 'text.secondary', lineHeight: 1.3 }}>
                {item.quantity} шт. × {fmtPrice(item.unitPrice)} грн. ={' '}
                <strong>{fmtPrice(item.quantity * toNum(item.unitPrice))} грн.</strong>
            </Typography>
        </Box>
        <Tooltip title={L.EDIT}>
            <IconButton size="small" onClick={onEdit} sx={{ color: '#B874CE', p: 0.4 }}>
                <EditIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
        </Tooltip>
        <Tooltip title={L.DELETE}>
            <IconButton size="small" onClick={onDelete} color="error" sx={{ p: 0.4 }}>
                <DeleteIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
        </Tooltip>
    </Box>
);

// ─── ComponentResult ───────────────────────────────────────────────────────────

const ComponentResult = ({ component, isSelected, onSelect, onDelete, L }) => (
    <Box
        onClick={() => onSelect(component)}
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: 1.2,
            py: 0.8,
            borderBottom: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            bgcolor: isSelected ? 'rgba(184,116,206,0.1)' : 'transparent',
            borderLeft: isSelected ? '3px solid #B874CE' : '3px solid transparent',
            '&:hover': { bgcolor: isSelected ? 'rgba(184,116,206,0.12)' : 'rgba(0,0,0,0.03)', '& .comp-delete-btn': { opacity: 1 } },
            transition: 'background-color 0.1s',
        }}
    >
        <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: isSelected ? 600 : 400, lineHeight: 1.3 }}>
                <span style={{ color: '#5A6878' }}>{component.producerName} · </span>
                {component.name}
            </Typography>
            <Typography sx={{ fontSize: '0.71rem', color: 'text.secondary', lineHeight: 1.2 }}>
                {component.categoryName}
            </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, color: 'text.primary' }}>
            {fmtPrice(component.price)} грн.
        </Typography>
        {onDelete && (
            <Tooltip title={L.DELETE_COMP}>
                <IconButton
                    className="comp-delete-btn"
                    size="small"
                    color="error"
                    onClick={(e) => { e.stopPropagation(); onDelete(component.id); }}
                    sx={{ opacity: 0, transition: 'opacity 0.15s', ml: 0.3, flexShrink: 0 }}
                >
                    <DeleteIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
            </Tooltip>
        )}
    </Box>
);

// ─── QtyStepper ────────────────────────────────────────────────────────────────

const QtyStepper = ({ value, onChange, min = 1, max = Infinity }) => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid rgba(0,0,0,0.23)',
            borderRadius: 1,
            bgcolor: 'background.paper',
            overflow: 'hidden',
            height: 36,
        }}
    >
        <IconButton
            size="small"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            sx={{ borderRadius: 0, px: 0.8, height: '100%' }}
        >
            <RemoveIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
        <Typography
            sx={{ minWidth: 36, textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, userSelect: 'none' }}
        >
            {value}
        </Typography>
        <IconButton
            size="small"
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            sx={{ borderRadius: 0, px: 0.8, height: '100%' }}
        >
            <AddIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
    </Box>
);

// ─── AddItemBar ───────────────────────────────────────────────────────────────
// Локальний стан qty/price — не перерендерює батька при кожному введенні.

const AddItemBar = React.memo(({ component, initialQty, initialPrice, isEditing, onConfirm, onCancel, L }) => {
    const [qty, setQty] = useState(initialQty ?? 1);
    const [price, setPrice] = useState(() =>
        initialPrice != null ? String(toNum(initialPrice)) : ''
    );

    const parsedPrice = toNum(price);
    const valid = parsedPrice > 0;

    const handleConfirm = () => {
        const q = Math.max(1, Number(qty));
        if (!parsedPrice || parsedPrice <= 0) return;
        onConfirm(q, parsedPrice);
    };

    return (
        <Box
            sx={{
                flexShrink: 0,
                px: 2,
                py: 1.2,
                borderTop: '1px solid rgba(184,116,206,0.3)',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184,116,206,0.07)' : 'rgba(248,240,252,0.9)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexWrap: 'wrap',
            }}
        >
            <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: 600, flex: '1 1 200px', minWidth: 0 }}>
                <span style={{ color: '#B874CE' }}>▶</span>{' '}
                {[component.producerName, component.name].filter(Boolean).join(', ')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {L.QUANTITY}
                </Typography>
                <QtyStepper value={qty} onChange={setQty} />
            </Box>
            <TextField
                size="small"
                label={L.UNIT_PRICE}
                value={price}
                onChange={(e) => { if (isValidPriceInput(e.target.value)) setPrice(e.target.value); }}
                type="text"
                inputMode="decimal"
                inputProps={{ inputMode: 'decimal' }}
                sx={{ width: 160, bgcolor: 'background.paper', flexShrink: 0 }}
            />
            <Button
                variant="contained"
                size="small"
                onClick={handleConfirm}
                disabled={!valid}
                sx={{ flexShrink: 0, bgcolor: '#B874CE', '&:hover': { bgcolor: '#A45DBB' } }}
            >
                {isEditing ? L.UPDATE : L.ADD_TO_ORDER}
            </Button>
            <Button
                variant="text"
                size="small"
                onClick={onCancel}
                sx={{ flexShrink: 0, color: 'text.secondary', fontSize: '0.78rem' }}
            >
                {L.CANCEL}
            </Button>
        </Box>
    );
});

// ─── CreateComponentForm ──────────────────────────────────────────────────────
// Окремий компонент з локальним станом — зміни полів не перерендерюють батька.

const EMPTY_NEW_COMP = {
    categoryId: '',
    warrantyObligationId: '',
    producerId: '',
    model: '',
    price: '',
    warrantyPeriod: 12,
};

const CreateComponentForm = React.memo(({ categories, producers, warrantyObligations, onCreated, onCancel, L }) => {
    const [form, setForm] = useState(EMPTY_NEW_COMP);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.categoryId || !form.producerId || !form.model.trim() || !form.price || !form.warrantyObligationId) {
            setError(L.ERR_REQUIRED);
            return;
        }
        if (form.model.trim().length > 40) {
            setError(L.ERR_MODEL_LEN);
            return;
        }
        const priceNum = toNum(form.price);
        if (priceNum < 0.01) {
            setError(L.ERR_PRICE_MIN);
            return;
        }
        if (priceNum > MAX_COMPONENT_PRICE) {
            setError(L.ERR_PRICE_MAX);
            return;
        }
        setSaving(true);
        setError('');
        try {
            const created = await createComponent({
                componentModel: form.model.trim(),
                producerId: Number(form.producerId),
                categoryId: Number(form.categoryId),
                warrantyObligationId: Number(form.warrantyObligationId),
                warrantyPeriod: Number(form.warrantyPeriod),
                componentPrice: toNum(form.price),
            });
            onCreated(created);
        } catch (err) {
            setError(err.response?.data?.message || err.message || L.ERR_CREATE_COMP);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box
            sx={{
                mx: 2,
                mb: 1,
                p: 1.5,
                border: '1px solid rgba(184,116,206,0.35)',
                borderRadius: 1.5,
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184,116,206,0.06)' : 'rgba(248,240,252,0.8)',
                flexShrink: 0,
            }}
        >
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#B874CE', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {L.NEW_COMPONENT}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>{L.CATEGORY_REQ}</InputLabel>
                    <Select label={L.CATEGORY_REQ} value={form.categoryId} onChange={set('categoryId')}>
                        {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>{L.WARRANTY_TYPE_REQ}</InputLabel>
                    <Select label={L.WARRANTY_TYPE_REQ} value={form.warrantyObligationId} onChange={set('warrantyObligationId')}>
                        <MenuItem value=""><em>{L.SELECT_PLACEHOLDER}</em></MenuItem>
                        {warrantyObligations.map((w) => <MenuItem key={w.id} value={w.id}>{w.description}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>{L.PRODUCER_REQ}</InputLabel>
                    <Select label={L.PRODUCER_REQ} value={form.producerId} onChange={set('producerId')}>
                        {producers.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                    </Select>
                </FormControl>
                <TextField
                    size="small"
                    label={L.CATALOG_PRICE_REQ}
                    value={form.price}
                    onChange={(e) => { if (isValidComponentPrice(e.target.value)) setForm((p) => ({ ...p, price: e.target.value })); }}
                    type="text"
                    inputMode="decimal"
                    inputProps={{ inputMode: 'decimal' }}
                    helperText={L.MAX_PRICE_HELP}
                    sx={{ flex: 1 }}
                />
                <Box>
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mb: 0.3, whiteSpace: 'nowrap' }}>
                        {L.WARRANTY_MONTHS}
                    </Typography>
                    <QtyStepper
                        value={form.warrantyPeriod}
                        onChange={(v) => setForm((p) => ({ ...p, warrantyPeriod: v }))}
                        min={0}
                    />
                </Box>
            </Box>

            <TextField
                size="small"
                label={L.MODEL_REQ}
                value={form.model}
                onChange={set('model')}
                fullWidth
                sx={{ mb: 1 }}
                inputProps={{ maxLength: 40 }}
                helperText={`${form.model.length}/40 ${L.CHARS}`}
                FormHelperTextProps={{
                    sx: { textAlign: 'right', mr: 0 },
                }}
            />

            {error && (
                <Typography sx={{ fontSize: '0.75rem', color: 'error.main', mb: 0.8 }}>
                    {error}
                </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button size="small" variant="text" color="inherit" onClick={onCancel} sx={{ color: 'text.secondary' }}>
                    {L.CANCEL}
                </Button>
                <Button
                    size="small"
                    variant="contained"
                    disabled={saving}
                    onClick={handleSubmit}
                    sx={{ bgcolor: '#B874CE', '&:hover': { bgcolor: '#A45DBB' } }}
                >
                    {saving && <CircularProgress size={12} color="inherit" sx={{ mr: 0.6 }} />}
                    {L.CREATE}
                </Button>
            </Box>
        </Box>
    );
});

// ─── Phone formatting (same as CreateOrderModal) ─────────────────────────────

const formatPhoneUa = (rawValue) => {
    const digits = String(rawValue ?? '').replace(/\D/g, '');

    let localDigits = digits;
    if (localDigits.startsWith('380')) {
        localDigits = localDigits.slice(3);
    } else if (localDigits.startsWith('38')) {
        localDigits = localDigits.slice(2);
    }

    localDigits = localDigits.slice(0, 10);

    let result = '';
    if (localDigits.length > 0) {
        result += `(${localDigits.slice(0, 3)}`;
    }
    if (localDigits.length >= 3) {
        result += ')';
    }
    if (localDigits.length > 3) {
        result += ` ${localDigits.slice(3, 6)}`;
    }
    if (localDigits.length > 6) {
        result += `-${localDigits.slice(6, 8)}`;
    }
    if (localDigits.length > 8) {
        result += `-${localDigits.slice(8, 10)}`;
    }

    return result;
};

const normalizePhoneForApi = (phoneValue) => {
    const digits = String(phoneValue ?? '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('380')) return `+${digits.slice(0, 12)}`;
    if (digits.startsWith('38')) return `+${digits.slice(0, 12)}`;
    if (digits.length === 10 && digits.startsWith('0')) return `+38${digits}`;
    return `+${digits.slice(0, 15)}`;
};

// ─── CreateSupplierForm (isolated state to avoid re-rendering the whole modal) ──

const CreateSupplierForm = React.memo(({ onCreated, onCancel, L }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        const trimmed = value.trim();
        setEmailError(trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? L.ERR_EMAIL_FORMAT : '');
    };

    const handleSubmit = async () => {
        if (!name.trim()) { setError(L.ERR_SUPPLIER_REQ); return; }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setEmailError(L.ERR_EMAIL_FORMAT); return;
        }
        setLoading(true);
        setError('');
        try {
            const payload = { companyName: name.trim() };
            if (email.trim()) payload.email = email.trim();
            const normalizedPhone = normalizePhoneForApi(phone);
            if (normalizedPhone) payload.phone = normalizedPhone;
            const created = await createSupplier(payload);
            onCreated(created);
        } catch (err) {
            setError(err.response?.data?.message || err.message || L.ERR_CREATE_SUPPLIER);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 1.2,
                border: '1px solid',
                borderColor: 'primary.light',
                borderRadius: 1.5,
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(25,118,210,0.06)' : 'rgba(232,244,253,0.7)',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <TextField
                    size="small"
                    label={L.SUPPLIER_NAME}
                    placeholder={L.SUPPLIER_NAME_PLACEHOLDER}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    helperText={L.TEXT_SUPPORTED}
                    sx={{ flex: 1, bgcolor: 'background.paper' }}
                    inputProps={{ maxLength: 70 }}
                />
                <TextField
                    size="small"
                    label={L.SUPPLIER_EMAIL}
                    placeholder={L.EMAIL_PLACEHOLDER}
                    value={email}
                    onChange={handleEmailChange}
                    onKeyDown={handleKeyDown}
                    error={Boolean(emailError)}
                    helperText={emailError || L.TEXT_SUPPORTED}
                    sx={{ flex: 1, bgcolor: 'background.paper' }}
                    inputProps={{ maxLength: 70 }}
                />
                <TextField
                    size="small"
                    label={L.SUPPLIER_PHONE}
                    placeholder="(0_ _) _ _ _-_ _-_ _"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneUa(e.target.value))}
                    onKeyDown={handleKeyDown}
                    helperText={L.ONLY_DIGITS}
                    sx={{ flex: 1, bgcolor: 'background.paper' }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start" sx={{ mr: 0.3 }}>
                                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 500 }}>
                                        +38
                                    </Typography>
                                </InputAdornment>
                            ),
                            inputMode: 'numeric',
                        },
                    }}
                    inputProps={{ maxLength: 15 }}
                />
            </Box>
            {error && (
                <Alert severity="error" sx={{ py: 0.2, px: 1, fontSize: '0.78rem' }}>
                    {error}
                </Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                    variant="contained"
                    size="small"
                    disabled={loading}
                    onClick={handleSubmit}
                    sx={{ flexShrink: 0 }}
                >
                    {loading && <CircularProgress size={12} color="inherit" sx={{ mr: 0.6 }} />}
                    {L.CREATE}
                </Button>
                <Button
                    variant="text"
                    size="small"
                    onClick={onCancel}
                    sx={{ flexShrink: 0, color: 'text.secondary' }}
                >
                    {L.CANCEL}
                </Button>
            </Box>
        </Box>
    );
});

// ─── ComponentOrderModal ───────────────────────────────────────────────────────

// editOrder: об'єкт замовлення з GET /api/component-orders/{orderId} для режиму редагування.
// Потребує полів supplierId (або supplierName для пошуку) та item.componentId у відповіді бекенду.
const ComponentOrderModal = ({ open, onClose, onOrderCreated, onOrderUpdated, editOrder = null }) => {
    const { labels, lang } = useLanguage();
    const L = labels.supplies.MODAL;
    const isEditMode = Boolean(editOrder);
    // ── Static reference data ─────────────────────────────────────────────
    const [categories, setCategories] = useState([]);
    const [producers, setProducers] = useState([]);
    const [warrantyObligations, setWarrantyObligations] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // ── Left panel: branch stock ──────────────────────────────────────────
    const [stock, setStock] = useState([]);
    const [loadingStock, setLoadingStock] = useState(false);
    const [stockSearch, setStockSearch] = useState('');

    // ── Component search (right panel) ────────────────────────────────────
    const [searchText, setSearchText] = useState('');
    const [filterCategoryId, setFilterCategoryId] = useState('');
    const [filterProducerId, setFilterProducerId] = useState('');
    const [components, setComponents] = useState([]);
    const [loadingComponents, setLoadingComponents] = useState(false);
    const searchTimerRef = useRef(null);

    // ── Create component form ─────────────────────────────────────────────
    const [createOpen, setCreateOpen] = useState(false);

    // ── Add / edit order item ─────────────────────────────────────────────
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    // ── Order items list ──────────────────────────────────────────────────
    const [orderItems, setOrderItems] = useState([]);

    // ── Order metadata ────────────────────────────────────────────────────
    const [expectedDate, setExpectedDate] = useState('');
    const [supplierId, setSupplierId] = useState('');

    // ── Create supplier ───────────────────────────────────────────────────
    const [createSupplierOpen, setCreateSupplierOpen] = useState(false);

    // ── Submit state ──────────────────────────────────────────────────────
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // ── Load static data when modal opens ─────────────────────────────────

    useEffect(() => {
        if (!open) return;

        const controller = new AbortController();

        setSelectedComponent(null);
        setEditingIndex(null);
        setCreateOpen(false);
        setSearchText('');
        setFilterCategoryId('');
        setFilterProducerId('');
        setStockSearch('');
        setSubmitError('');
        setCreateSupplierOpen(false);

        if (isEditMode) {
            // Pre-populate from existing order
            setExpectedDate(editOrder.expectedExecutionDate || '');
            // Map order items. component.id береться з item.componentId —
            // якщо бекенд не повертає це поле, id буде null (позиція відобразиться,
            // але сабміт потребуватиме componentId від бекенду).
            const preItems = (editOrder.items || []).map(item => ({
                component: {
                    id: item.componentId ?? null,
                    name: item.componentModel,
                    producerName: item.producer,
                    categoryName: item.componentCategory,
                    price: item.unitPrice,
                },
                quantity: item.orderedQuantity,
                unitPrice: item.unitPrice,
            }));
            setOrderItems(preItems);
        } else {
            setOrderItems([]);
            setSupplierId('');
            setExpectedDate('');
        }

        Promise.all([
            fetchCategories(),
            fetchProducers(),
            fetchWarrantyObligations(),
            fetchSuppliers(),
        ])
            .then(([cats, prods, warr, supps]) => {
                if (controller.signal.aborted) return;
                setCategories(cats);
                setProducers(prods);
                setWarrantyObligations(warr);
                setSuppliers(supps);

                // Встановлюємо постачальника для edit mode
                if (isEditMode) {
                    const matchById = editOrder.supplierId
                        ? supps.find(s => s.id === editOrder.supplierId)
                        : null;
                    const matchByName = supps.find(s => s.companyName === editOrder.supplierName);
                    const matched = matchById || matchByName;
                    setSupplierId(matched ? matched.id : '');
                }
            })
            .catch(() => {});

        // Завантажуємо залишки поточного відділення через /api/stock/my
        setLoadingStock(true);
        fetchMyStock()
            .then((s) => { if (!controller.signal.aborted) setStock(s); })
            .catch(() => {})
            .finally(() => { if (!controller.signal.aborted) setLoadingStock(false); });

        return () => controller.abort();
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Debounced component search ────────────────────────────────────────

    const loadComponents = useCallback(async (params) => {
        setLoadingComponents(true);
        try {
            const data = await fetchComponents(params);
            setComponents(data);
        } catch {
            setComponents([]);
        } finally {
            setLoadingComponents(false);
        }
    }, []);

    // Запит іде лише якщо є хоч один активний фільтр:
    // пошуковий текст ≥ 2 символи, або обрана категорія, або обраний виробник.
    // Без фільтрів — список очищається і показується підказка.
    const hasComponentFilter =
        searchText.trim().length >= 2 || !!filterCategoryId || !!filterProducerId;

    useEffect(() => {
        if (!open) return;
        clearTimeout(searchTimerRef.current);

        if (!hasComponentFilter) {
            setComponents([]);
            return;
        }

        searchTimerRef.current = setTimeout(() => {
            const params = {};
            if (searchText.trim()) params.search = searchText.trim();
            if (filterCategoryId) params.categoryId = filterCategoryId;
            if (filterProducerId) params.producerId = filterProducerId;
            loadComponents(params);
        }, 350);
        return () => clearTimeout(searchTimerRef.current);
    }, [searchText, filterCategoryId, filterProducerId, open, loadComponents, hasComponentFilter]);

    // ── Filtered stock (client-side) ──────────────────────────────────────

    const visibleStock = useMemo(() => {
        const q = stockSearch.trim().toLowerCase();
        if (!q) return stock;
        return stock.filter(
            (item) =>
                item.componentModel?.toLowerCase().includes(q) ||
                item.producerName?.toLowerCase().includes(q) ||
                item.categoryName?.toLowerCase().includes(q)
        );
    }, [stock, stockSearch]);

    // ── Component selection ───────────────────────────────────────────────

    const handleSelectComponent = (c) => {
        setSelectedComponent(c);
        setEditingIndex(null);
    };

    // ── Order item operations ─────────────────────────────────────────────

    const handleEditItem = (idx) => {
        const item = orderItems[idx];
        setSelectedComponent(item.component);
        setEditingIndex(idx);
    };

    const handleDeleteItem = (idx) => {
        setOrderItems((prev) => prev.filter((_, i) => i !== idx));
        if (editingIndex === idx) {
            setSelectedComponent(null);
            setEditingIndex(null);
        }
    };

    const handleConfirmAdd = useCallback((qty, price) => {
        if (!selectedComponent) return;
        const newItem = { component: selectedComponent, quantity: qty, unitPrice: price };
        if (editingIndex != null) {
            setOrderItems((prev) => prev.map((item, i) => (i === editingIndex ? newItem : item)));
        } else {
            setOrderItems((prev) => [...prev, newItem]);
        }
        setSelectedComponent(null);
        setEditingIndex(null);
    }, [selectedComponent, editingIndex]);

    const handleCancelAdd = useCallback(() => {
        setSelectedComponent(null);
        setEditingIndex(null);
    }, []);

    // ── Create supplier callback ─────────────────────────────────────────

    const handleSupplierCreated = useCallback(async (created) => {
        const updated = await fetchSuppliers();
        setSuppliers(updated);
        setSupplierId(created.id);
        setCreateSupplierOpen(false);
    }, []);

    const handleSupplierCancel = useCallback(() => {
        setCreateSupplierOpen(false);
    }, []);

    const handleDeleteSupplier = useCallback(async () => {
        if (!supplierId) return;
        try {
            await deleteSupplier(supplierId);
            const updated = await fetchSuppliers();
            setSuppliers(updated);
            setSupplierId('');
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || (lang === 'ua' ? 'Не вдалося видалити постачальника.' : 'Failed to delete supplier.'), severity: 'error' });
        }
    }, [supplierId]);

    // ── Delete component callback ──────────────────────────────────────────

    const handleDeleteComponent = useCallback(async (componentId) => {
        try {
            await deleteComponent(componentId);
            setComponents((prev) => prev.filter((c) => c.id !== componentId));
            if (selectedComponent?.id === componentId) {
                setSelectedComponent(null);
                setEditingIndex(null);
            }
            setOrderItems((prev) => prev.filter((item) => item.component.id !== componentId));
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || (lang === 'ua' ? 'Не вдалося видалити комплектуючу.' : 'Failed to delete component.'), severity: 'error' });
        }
    }, [selectedComponent]);

    // ── Create component callback (з'єднує CreateComponentForm з батьком) ──

    const handleComponentCreated = useCallback(async (created) => {
        await loadComponents(
            searchText.trim() || filterCategoryId || filterProducerId
                ? { ...(searchText.trim() && { search: searchText.trim() }), ...(filterCategoryId && { categoryId: filterCategoryId }), ...(filterProducerId && { producerId: filterProducerId }) }
                : {}
        );
        setCreateOpen(false);
        if (created?.id) handleSelectComponent(created);
    }, [loadComponents, searchText, filterCategoryId, filterProducerId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Submit order ──────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (orderItems.length === 0) { setSubmitError(L.ERR_NO_ITEMS); return; }
        if (!supplierId) { setSubmitError(L.ERR_NO_SUPPLIER); return; }
        if (orderItems.some(item => !item.component.id)) {
            setSubmitError('Деякі позиції не мають ID комплектуючої — бекенд має повертати componentId у відповіді GET /api/component-orders/{id}.');
            return;
        }

        setSubmitting(true);
        setSubmitError('');
        try {
            const payload = {
                supplierId: Number(supplierId),
                items: orderItems.map((item) => ({
                    componentId: item.component.id,
                    quantity: item.quantity,
                    unitPrice: toNum(item.unitPrice),
                })),
            };
            if (expectedDate) payload.expectedExecutionDate = expectedDate;

            if (isEditMode) {
                await updateComponentOrder(editOrder.id, payload);
                setSnackbar({ open: true, message: lang === 'ua' ? 'Замовлення успішно оновлено.' : 'Order updated successfully.', severity: 'success' });
                onOrderUpdated?.();
            } else {
                await createComponentOrder(payload);
                setSnackbar({ open: true, message: lang === 'ua' ? 'Замовлення успішно створено.' : 'Order created successfully.', severity: 'success' });
                onOrderCreated?.();
            }
            onClose();
        } catch (err) {
            setSubmitError(
                err.response?.data?.message || err.message ||
                (isEditMode ? L.ERR_UPDATE_ORDER : L.ERR_CREATE_ORDER)
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ── Derived values ────────────────────────────────────────────────────

    const estimatedTotal = useMemo(
        () => orderItems.reduce((sum, item) => sum + item.quantity * toNum(item.unitPrice), 0),
        [orderItems]
    );

    // Початкові значення для AddItemBar (беремо з існуючого item при редагуванні)
    const editingItem = editingIndex != null ? orderItems[editingIndex] : null;

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            slotProps={{ paper: { sx: { height: '90vh', maxHeight: '90vh', overflow: 'hidden', borderRadius: 2 } } }}
        >
            {/* ── Header ── */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    px: 2.5,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    flexShrink: 0,
                }}
            >
                {isEditMode
                    ? `${L.TITLE_EDIT} ${editOrder.orderNumber}`
                    : L.TITLE_CREATE}
                <IconButton size="small" onClick={onClose} sx={{ ml: 1 }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0, overflow: 'hidden', flex: 1 }}>

                {/* ── Main two-panel row ── */}
                <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

                    {/* ── Left: branch stock ── */}
                    <Box
                        sx={{
                            width: 411,
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F4F7FB',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        {/* Left header */}
                        <Box sx={{ px: 1.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                                {L.BRANCH_STOCK}
                            </Typography>
                            <TextField
                                size="small"
                                placeholder="Фільтр..."
                                value={stockSearch}
                                onChange={(e) => setStockSearch(e.target.value)}
                                fullWidth
                                sx={{ bgcolor: 'background.paper' }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <SearchIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                    sx: { fontSize: '0.8rem' },
                                }}
                            />
                        </Box>

                        {/* Left scrollable list */}
                        <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 1.5 }}>
                            {loadingStock ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
                                    <CircularProgress size={22} />
                                </Box>
                            ) : visibleStock.length === 0 ? (
                                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', textAlign: 'center', pt: 2 }}>
                                    {stock.length === 0 ? L.HINT_NO_RESULTS : L.HINT_NO_RESULTS}
                                </Typography>
                            ) : (
                                visibleStock.map((item) => (
                                    <StockCard
                                        key={item.id}
                                        item={item}
                                        isSelected={selectedComponent?.id === item.componentId}
                                        onSelect={() => handleSelectComponent({
                                            id: item.componentId,
                                            name: item.componentModel,
                                            price: item.price,
                                            producerName: item.producerName,
                                            categoryName: item.categoryName,
                                        })}
                                    />
                                ))
                            )}
                        </Box>
                    </Box>

                    {/* ── Right: order builder ── */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                        {/* Order items list */}
                        <Box
                            sx={{
                                flexShrink: 0,
                                maxHeight: 200,
                                overflowY: 'auto',
                                px: 2,
                                pt: 1.5,
                                pb: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184,116,206,0.04)' : 'rgba(184,116,206,0.03)',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.8, gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography component="span" sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase' }}>
                                        {L.ADDED_ITEMS}
                                    </Typography>
                                    {orderItems.length > 0 && (
                                        <Chip label={orderItems.length} size="small" sx={{ height: 16, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.7 } }} />
                                    )}
                                </Box>
                            </Box>

                            {orderItems.length === 0 ? (
                                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontStyle: 'italic', pb: 0.5 }}>
                                    {L.HINT_NO_RESULTS}
                                </Typography>
                            ) : (
                                orderItems.map((item, idx) => (
                                    <OrderItemRow
                                        key={idx}
                                        item={item}
                                        onEdit={() => handleEditItem(idx)}
                                        onDelete={() => handleDeleteItem(idx)}
                                        L={L}
                                    />
                                ))
                            )}
                        </Box>

                        {/* Component search area */}
                        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                            {/* Search + filters */}
                            <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                                <TextField
                                    size="small"
                                    placeholder={L.SEARCH_COMPONENTS}
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    fullWidth
                                    sx={{ mb: 1, bgcolor: 'background.paper' }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <SearchIcon fontSize="small" color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <FormControl size="small" sx={{ flex: 1, bgcolor: 'background.paper' }}>
                                        <InputLabel>{labels.supplies.FILTER.CATEGORY}</InputLabel>
                                        <Select
                                            label={labels.supplies.FILTER.CATEGORY}
                                            value={filterCategoryId}
                                            onChange={(e) => setFilterCategoryId(e.target.value)}
                                        >
                                            <MenuItem value=""><em>{labels.supplies.FILTER.ALL}</em></MenuItem>
                                            {categories.map((c) => (
                                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ flex: 1, bgcolor: 'background.paper' }}>
                                        <InputLabel>{L.PRODUCER_REQ.replace(' *', '')}</InputLabel>
                                        <Select
                                            label={L.PRODUCER_REQ.replace(' *', '')}
                                            value={filterProducerId}
                                            onChange={(e) => setFilterProducerId(e.target.value)}
                                        >
                                            <MenuItem value=""><em>{labels.supplies.FILTER.ALL}</em></MenuItem>
                                            {producers.map((p) => (
                                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button
                                        size="small"
                                        variant={createOpen ? 'outlined' : 'text'}
                                        onClick={() => setCreateOpen((v) => !v)}
                                        sx={{
                                            flexShrink: 0,
                                            fontSize: '0.78rem',
                                            color: '#B874CE',
                                            borderColor: '#B874CE',
                                            whiteSpace: 'nowrap',
                                            '&:hover': { borderColor: '#A45DBB', bgcolor: 'rgba(184,116,206,0.06)' },
                                        }}
                                    >
                                        {createOpen ? `✕ ${L.CANCEL}` : `+ ${L.NEW_COMPONENT}`}
                                    </Button>
                                </Box>
                            </Box>

                            {/* Component list (+ create form at top when open) */}
                            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                                {/* Create component form — inside the scroll area so it doesn't crush the list */}
                                {createOpen && (
                                    <CreateComponentForm
                                        categories={categories}
                                        producers={producers}
                                        warrantyObligations={warrantyObligations}
                                        onCreated={handleComponentCreated}
                                        onCancel={() => setCreateOpen(false)}
                                        L={L}
                                    />
                                )}

                                {loadingComponents ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
                                        <CircularProgress size={22} />
                                    </Box>
                                ) : !hasComponentFilter ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, gap: 0.8, color: 'text.disabled' }}>
                                        <SearchIcon sx={{ fontSize: '2rem', opacity: 0.4 }} />
                                        <Typography sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                            {L.HINT_NO_FILTER}
                                        </Typography>
                                    </Box>
                                ) : components.length === 0 ? (
                                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', textAlign: 'center', pt: 3 }}>
                                        {L.HINT_NO_RESULTS}
                                    </Typography>
                                ) : (
                                    components.map((c) => (
                                        <ComponentResult
                                            key={c.id}
                                            component={c}
                                            isSelected={selectedComponent?.id === c.id && editingIndex == null}
                                            onSelect={handleSelectComponent}
                                            onDelete={handleDeleteComponent}
                                            L={L}
                                        />
                                    ))
                                )}
                            </Box>
                        </Box>

                        {/* Add / edit bar — окремий компонент, key скидає стан при зміні компонента */}
                        {selectedComponent && (
                            <AddItemBar
                                key={`${selectedComponent.id}-${editingIndex ?? 'new'}`}
                                component={selectedComponent}
                                initialQty={editingItem?.quantity ?? 1}
                                initialPrice={editingItem?.unitPrice ?? selectedComponent.price}
                                isEditing={editingIndex != null}
                                onConfirm={handleConfirmAdd}
                                onCancel={handleCancelAdd}
                                L={L}
                            />
                        )}
                    </Box>
                </Box>

                {/* ── Footer ── */}
                <Box
                    sx={{
                        flexShrink: 0,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        px: 2.5,
                        pt: 1.5,
                        pb: 1.5,
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.2,
                    }}
                >
                    {/* Row 1: date + supplier + new-supplier button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DatePicker
                            label={L.EXPECTED_DATE}
                            value={expectedDate ? dayjs(expectedDate) : null}
                            onChange={(v) => setExpectedDate(v ? v.format('YYYY-MM-DD') : '')}
                            minDate={dayjs().add(1, 'day')}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: { width: 300, bgcolor: 'background.paper' },
                                    InputLabelProps: { sx: { fontSize: '0.78rem' } },
                                    helperText: 'Не раніше завтрашнього дня',
                                },
                            }}
                        />

                        {/* Supplier */}
                        <FormControl size="small" sx={{ width: 260 }}>
                            <InputLabel>{L.SUPPLIER}</InputLabel>
                            <Select
                                label={L.SUPPLIER}
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                            >
                                <MenuItem value=""><em>{L.SELECT_PLACEHOLDER}</em></MenuItem>
                                {suppliers.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.companyName ?? `#${s.id}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Delete selected supplier */}
                        {supplierId && (
                            <Tooltip title={L.DELETE}>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={handleDeleteSupplier}
                                    sx={{ flexShrink: 0 }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {/* Toggle create supplier */}
                        <Button
                            size="small"
                            variant={createSupplierOpen ? 'outlined' : 'text'}
                            onClick={() => setCreateSupplierOpen((v) => !v)}
                            sx={{
                                fontSize: '0.78rem',
                                color: 'primary.main',
                                borderColor: 'primary.main',
                                whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: 'rgba(25,118,210,0.05)' },
                            }}
                        >
                            {createSupplierOpen ? `✕ ${L.CANCEL}` : `+ ${L.CREATE_NEW}`}
                        </Button>
                    </Box>

                    {/* Inline create-supplier form (isolated state) */}
                    {createSupplierOpen && (
                        <CreateSupplierForm
                            onCreated={handleSupplierCreated}
                            onCancel={handleSupplierCancel}
                            L={L}
                        />
                    )}

                    {/* Row 2: error + total + submit */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {submitError && (
                            <Alert severity="error" sx={{ py: 0.3, px: 1, fontSize: '0.8rem', flex: 1 }}>
                                {submitError}
                            </Alert>
                        )}
                        <Box sx={{ flex: 1 }} />
                        {orderItems.length > 0 && (
                            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                <Typography sx={{ fontSize: '0.71rem', color: 'text.secondary', lineHeight: 1 }}>
                                    {L.TOTAL_AMOUNT}
                                </Typography>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.4 }}>
                                    {fmtPrice(estimatedTotal)} грн.
                                </Typography>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            disabled={submitting}
                            onClick={handleSubmit}
                            sx={{ px: 3, flexShrink: 0 }}
                        >
                            {submitting && <CircularProgress size={14} color="inherit" sx={{ mr: 0.7 }} />}
                            {isEditMode ? L.UPDATE : L.SAVE_ORDER}
                        </Button>
                    </Box>
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

export default ComponentOrderModal;
