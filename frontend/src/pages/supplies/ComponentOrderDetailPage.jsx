import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    fetchComponentOrderDetail,
    fetchOrderSupplies,
    createOrderSupply,
    deleteComponentOrder,
} from '../../services/componentOrderService';
import {
    Alert,
    Box,
    Button,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Slider,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ComponentOrderModal from './components/ComponentOrderModal';
import { useLanguage } from '../../app/i18n/LanguageContext';

// ─── Design-system tokens ──────────────────────────────────────────────────────

const DS = {
    secondaryOne: { light: '#E3F2FD', dark: '#1F2937' },   // ліва панель
    secondaryTwo: { light: '#F3E5F5', dark: '#2D1B36' },   // права панель
    surface:      { light: '#FFFFFF', dark: '#161B22' },
    action:       { light: '#BA68C8', dark: '#BF7AF0' },
    actionHover:  { light: '#A45DBB', dark: '#AB65D9' },
};


// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d)) return v;
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
};

const formatDateTime = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d)) return v;
    return `${formatDate(v)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const fmtPrice = (v) =>
    Number(v || 0).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const calcItemProgress = (item) =>
    item.orderedQuantity === 0 ? 0 : Math.min(100, Math.round((item.suppliedQuantity / item.orderedQuantity) * 100));

// ─── ProgressRing ─────────────────────────────────────────────────────────────

const ProgressRing = ({ pct }) => {
    const color = pct === 0 ? '#B0BEC5' : pct >= 100 ? '#43A047' : '#FB8C00';
    const size = 30, r = 11, circ = 2 * Math.PI * r;
    return (
        <Box sx={{ flexShrink: 0, width: size, height: size, position: 'relative' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E0E0E0" strokeWidth={3}/>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
                    strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"/>
            </svg>
            <Box sx={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.5rem', fontWeight:700, color }}>
                {pct}%
            </Box>
        </Box>
    );
};

// ─── OrderedItemCard ──────────────────────────────────────────────────────────

const OrderedItemCard = ({ item, isDark, L }) => {
    const [open, setOpen] = useState(item.deliveries.length > 0);
    const pct = calcItemProgress(item);
    const subtle = isDark ? 'rgba(230,237,243,0.6)' : '#5A6878';
    const surface = isDark ? DS.surface.dark : DS.surface.light;

    return (
        <Box sx={{ border:'1px solid', borderColor:'divider', borderRadius:1.5, overflow:'hidden', mb:1 }}>
            <Box
                sx={{ display:'flex', alignItems:'center', gap:1, px:1.2, py:0.7, bgcolor: surface,
                    cursor: item.deliveries.length > 0 ? 'pointer' : 'default' }}
                onClick={() => item.deliveries.length > 0 && setOpen(v => !v)}
            >
                <ProgressRing pct={pct} />
                <Box sx={{ flex:1, minWidth:0 }}>
                    <Typography sx={{ fontSize:'0.83rem', fontWeight:600, wordBreak:'break-word' }}>
                        <span style={{ color: subtle }}>{item.producer},&nbsp;</span>
                        {item.componentModel}
                    </Typography>
                    <Typography sx={{ fontSize:'0.72rem', color: subtle }}>
                        {L.ORDERED_QTY}: {item.orderedQuantity}&nbsp;&nbsp;|&nbsp;&nbsp;{L.UNIT_PRICE}: {fmtPrice(item.unitPrice)}
                    </Typography>
                </Box>
                {item.deliveries.length > 0 && (
                    <IconButton size="small">
                        {open ? <ExpandLessIcon fontSize="small"/> : <ExpandMoreIcon fontSize="small"/>}
                    </IconButton>
                )}
            </Box>
            <Collapse in={open}>
                <Box sx={{ px:1.5, py:0.7, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F0F7FF', borderTop:'1px solid', borderColor:'divider' }}>
                    <Typography sx={{ fontSize:'0.68rem', fontWeight:700, color: subtle, mb:0.3, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                        {L.SUPPLIED_IN}:
                    </Typography>
                    {item.deliveries.map((d, i) => (
                        <Box key={i} sx={{ display:'flex', gap:2, py:0.2 }}>
                            <Typography sx={{ fontSize:'0.77rem', color: subtle }}>
                                {L.INVOICE_NUMBER}:&nbsp;<strong>{d.invoiceNumber}</strong>
                            </Typography>
                            <Typography sx={{ fontSize:'0.77rem', color: subtle }}>
                                {L.SUPPLIED_QTY}:&nbsp;<strong>{d.quantity}</strong>
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Collapse>
        </Box>
    );
};

// ─── DeliveryCard ─────────────────────────────────────────────────────────────

const DeliveryCard = ({ delivery, isDark, L }) => {
    const [open, setOpen] = useState(false);
    const subtle = isDark ? 'rgba(230,237,243,0.6)' : '#5A6878';
    const surface = isDark ? DS.surface.dark : DS.surface.light;
    const action = isDark ? DS.action.dark : DS.action.light;

    return (
        <Box sx={{ border:'1px solid', borderColor:'divider', borderRadius:1.5, overflow:'hidden', mb:1 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, px:1.2, py:0.8, bgcolor: surface, cursor:'pointer' }}
                onClick={() => setOpen(v => !v)}>
                <LocalShippingIcon sx={{ fontSize:'1rem', color: action, flexShrink:0 }}/>
                <Box sx={{ flex:1, minWidth:0 }}>
                    <Typography sx={{ fontSize:'0.83rem', fontWeight:700 }}>
                        {L.INVOICE_NUMBER}: {delivery.invoiceNumber}
                    </Typography>
                    <Typography sx={{ fontSize:'0.72rem', color: subtle }}>
                        {formatDateTime(delivery.deliveryDateTime)}
                    </Typography>
                </Box>
                <Box sx={{ textAlign:'right', flexShrink:0 }}>
                    <Typography sx={{ fontSize:'0.72rem', color: subtle }}>
                        {L.RECEIVED_BY}: <span style={{ color:'#1565C0', fontWeight:600 }}>{delivery.receivedBy}</span>
                    </Typography>
                    <Typography sx={{ fontSize:'0.76rem', fontWeight:600 }}>
                        {L.DELIVERY_SUM}: {fmtPrice(delivery.deliverySum)}
                    </Typography>
                </Box>
                <IconButton size="small" sx={{ flexShrink:0 }}>
                    {open ? <ExpandLessIcon fontSize="small"/> : <ExpandMoreIcon fontSize="small"/>}
                </IconButton>
            </Box>
            <Collapse in={open}>
                <Box sx={{ borderTop:'1px solid', borderColor:'divider' }}>
                    {delivery.items.length === 0 ? (
                        <Typography sx={{ fontSize:'0.78rem', color: subtle, p:2, fontStyle:'italic' }}>{L.NO_ITEMS}</Typography>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: isDark ? 'rgba(186,104,200,0.15)' : 'rgba(186,104,200,0.1)' }}>
                                    {L.TABLE_HEADERS.map(h => (
                                        <TableCell key={h} sx={{ fontSize:'0.68rem', fontWeight:700, color: action, py:0.5, whiteSpace:'nowrap' }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {delivery.items.map((item, i) => (
                                    <TableRow key={i} sx={{ bgcolor: i%2===0 ? (isDark ? 'rgba(186,104,200,0.06)' : 'rgba(243,229,245,0.5)') : 'transparent' }}>
                                        <TableCell sx={{ fontSize:'0.75rem', py:0.5 }}>{item.componentModel}</TableCell>
                                        <TableCell sx={{ fontSize:'0.75rem', py:0.5 }}>{item.componentCategory}</TableCell>
                                        <TableCell sx={{ fontSize:'0.75rem', py:0.5 }}>{item.producer}</TableCell>
                                        <TableCell sx={{ fontSize:'0.75rem', py:0.5, whiteSpace:'nowrap' }}>{fmtPrice(item.unitPrice)}</TableCell>
                                        <TableCell sx={{ fontSize:'0.75rem', py:0.5 }}>{item.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

// ─── QtyStepper ───────────────────────────────────────────────────────────────

const QtyStepper = ({ value, onChange, min = 1, max = Infinity }) => (
    <Box sx={{ display:'flex', alignItems:'center', border:'1px solid', borderColor:'divider', borderRadius:1, overflow:'hidden', height:36, bgcolor:'background.paper' }}>
        <IconButton size="small" onClick={() => onChange(Math.max(min, value-1))} disabled={value<=min} sx={{ borderRadius:0, px:0.8, height:'100%' }}>
            <RemoveIcon sx={{ fontSize:'0.9rem' }}/>
        </IconButton>
        <Typography sx={{ minWidth:40, textAlign:'center', fontSize:'0.88rem', fontWeight:600, userSelect:'none' }}>{value}</Typography>
        <IconButton size="small" onClick={() => onChange(Math.min(max, value+1))} disabled={value>=max} sx={{ borderRadius:0, px:0.8, height:'100%' }}>
            <AddIcon sx={{ fontSize:'0.9rem' }}/>
        </IconButton>
    </Box>
);

// ─── CreateDeliveryForm ───────────────────────────────────────────────────────

const CreateDeliveryForm = ({ orderItems, onSubmit, onCancel, isDark, L }) => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [addQty, setAddQty] = useState(1);
    const [deliveryItems, setDeliveryItems] = useState([]);
    const [error, setError] = useState('');

    const action = isDark ? DS.action.dark : DS.action.light;
    const actionHover = isDark ? DS.actionHover.dark : DS.actionHover.light;
    const surface = isDark ? DS.surface.dark : DS.surface.light;
    const subtle = isDark ? 'rgba(230,237,243,0.6)' : '#5A6878';

    const availableItems = orderItems.filter(item => {
        const alreadyAdded = deliveryItems.find(d => d.orderItemId === item.id);
        const remaining = item.orderedQuantity - item.suppliedQuantity - (alreadyAdded?.quantity ?? 0);
        return remaining > 0;
    });

    const selectedOrderItem = orderItems.find(i => i.id === selectedItemId);
    const alreadyAdded = deliveryItems.find(d => d.orderItemId === selectedItemId);
    const remaining = selectedOrderItem
        ? selectedOrderItem.orderedQuantity - selectedOrderItem.suppliedQuantity - (alreadyAdded?.quantity ?? 0)
        : 1;

    const handleSelectItem = (id) => {
        setSelectedItemId(id);
        setAddQty(1);
    };

    const handleAddItem = () => {
        if (!selectedItemId) return;
        const item = orderItems.find(i => i.id === selectedItemId);
        if (!item) return;
        setDeliveryItems(prev => {
            const existing = prev.findIndex(d => d.orderItemId === selectedItemId);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + addQty };
                return updated;
            }
            return [...prev, {
                orderItemId: item.id,
                producer: item.producer,
                componentModel: item.componentModel,
                componentCategory: item.componentCategory,
                unitPrice: item.unitPrice,
                quantity: addQty,
            }];
        });
        setSelectedItemId('');
        setAddQty(1);
    };

    const handleDeleteDeliveryItem = (orderItemId) => {
        setDeliveryItems(prev => prev.filter(d => d.orderItemId !== orderItemId));
    };

    const handleSubmit = () => {
        if (!invoiceNumber.trim()) { setError(L.ERR_INVOICE_REQ); return; }
        if (invoiceNumber.trim().length !== 10) { setError(L.ERR_INVOICE_LEN); return; }
        if (deliveryItems.length === 0) { setError(L.ERR_NO_ITEMS_DELIVERY); return; }
        setError('');
        const sum = deliveryItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        onSubmit({
            invoiceNumber: invoiceNumber.trim(),
            deliverySum: sum,
            items: deliveryItems,
        });
    };

    return (
        <Box sx={{ display:'flex', flexDirection:'column', gap:1.5, height:'100%' }}>

            {/* Invoice number */}
            <TextField
                size="small"
                label={L.INVOICE_LABEL}
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                error={invoiceNumber.length > 0 && invoiceNumber.length !== 10}
                helperText={invoiceNumber.length > 0 && invoiceNumber.length !== 10
                    ? `${invoiceNumber.length}/10 ${L.INVOICE_ERR_LEN}`
                    : L.INVOICE_HINT}
                inputProps={{ maxLength: 10 }}
                sx={{ bgcolor: surface }}
            />

            <Divider/>

            {/* Component selector section */}
            <Box
                sx={{
                    border:'1px solid', borderColor: isDark ? 'rgba(186,104,200,0.3)' : 'rgba(186,104,200,0.25)',
                    borderRadius:1.5, p:1.5,
                    bgcolor: isDark ? 'rgba(186,104,200,0.06)' : 'rgba(243,229,245,0.5)',
                }}
            >
                <Typography sx={{ fontSize:'0.72rem', fontWeight:700, color: action, mb:1, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    {L.ADD_COMPONENTS_TITLE}
                </Typography>

                {/* Dropdown */}
                <FormControl size="small" fullWidth sx={{ mb:1, bgcolor: surface }}>
                    <InputLabel>{L.SELECT_COMPONENT}</InputLabel>
                    <Select
                        label={L.SELECT_COMPONENT}
                        value={selectedItemId}
                        onChange={e => handleSelectItem(e.target.value)}
                    >
                        <MenuItem value=""><em>{L.NOT_SELECTED}</em></MenuItem>
                        {availableItems.map(item => (
                            <MenuItem key={item.id} value={item.id}>
                                {item.producer}, {item.componentModel} — {L.REMAINING_LABEL}: {item.orderedQuantity - item.suppliedQuantity} {L.PCS_SHORT}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Qty stepper + slider */}
                {selectedItemId && (
                    <Box sx={{ mb:1 }}>
                        <Typography sx={{ fontSize:'0.72rem', color: subtle, mb:0.5 }}>
                            {L.ADD_QTY_PREFIX} {remaining})
                        </Typography>
                        <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
                            <Slider
                                value={addQty}
                                onChange={(_, v) => setAddQty(v)}
                                min={1} max={remaining} step={1}
                                size="small"
                                sx={{ flex:1, color: action }}
                            />
                            <QtyStepper value={addQty} onChange={setAddQty} min={1} max={remaining}/>
                        </Box>
                    </Box>
                )}

                <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    disabled={!selectedItemId}
                    onClick={handleAddItem}
                    sx={{ bgcolor: action, '&:hover':{ bgcolor: actionHover }, mt:0.5 }}
                >
                    {L.ADD_TO_DELIVERY}
                </Button>
            </Box>

            {/* Added delivery items list */}
            {deliveryItems.length > 0 && (
                <Box sx={{ flex:1, overflowY:'auto' }}>
                    {deliveryItems.map((d) => (
                        <Box
                            key={d.orderItemId}
                            sx={{
                                display:'flex', alignItems:'center', gap:1,
                                px:1.2, py:0.8,
                                border:'1px solid', borderColor: isDark ? 'rgba(186,104,200,0.25)' : 'rgba(186,104,200,0.2)',
                                borderRadius:1, mb:0.6,
                                bgcolor: isDark ? 'rgba(186,104,200,0.08)' : 'rgba(243,229,245,0.6)',
                            }}
                        >
                            <Box sx={{ flex:1, minWidth:0 }}>
                                <Typography noWrap sx={{ fontSize:'0.82rem', fontWeight:600 }}>
                                    {d.producer}, {d.componentModel}, {d.componentCategory}
                                </Typography>
                                <Typography sx={{ fontSize:'0.73rem', color: subtle }}>
                                    {L.SUPPLIED_UNITS}: {d.quantity}
                                </Typography>
                            </Box>
                            <Tooltip title={L.DELETE}>
                                <IconButton size="small" color="error" onClick={() => handleDeleteDeliveryItem(d.orderItemId)}>
                                    <DeleteIcon sx={{ fontSize:'0.9rem' }}/>
                                </IconButton>
                            </Tooltip>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Error */}
            {error && (
                <Typography sx={{ fontSize:'0.78rem', color:'error.main' }}>
                    {error}
                </Typography>
            )}

            {/* Footer actions */}
            <Box sx={{ display:'flex', justifyContent:'flex-end', gap:1, mt:'auto', pt:0.5 }}>
                <Button size="small" variant="text" onClick={onCancel} sx={{ color: subtle }}>
                    {L.CANCEL}
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleSubmit}
                    sx={{ bgcolor: action, '&:hover':{ bgcolor: actionHover }, px:3 }}
                >
                    {L.CONFIRM}
                </Button>
            </Box>
        </Box>
    );
};

// ─── ComponentOrderDetailPage ─────────────────────────────────────────────────

// Деривує масив поставок для конкретної позиції замовлення із загального списку supplies.
const deriveItemDeliveries = (supplies, itemId) =>
    supplies
        .flatMap(s => s.items.map(i => ({ ...i, invoiceNumber: s.invoiceNumber, deliveryDateTime: s.deliveryDateTime })))
        .filter(i => i.orderItemId === itemId);

const ComponentOrderDetailPage = () => {
    const { supplyId } = useParams();
    const { lang, labels } = useLanguage();
    const L = labels.supplies.DETAIL;
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [order, setOrder] = useState(null);
    const [supplies, setSupplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Паралельне завантаження деталей замовлення та списку поставок
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const [orderData, suppliesData] = await Promise.all([
                fetchComponentOrderDetail(supplyId),
                fetchOrderSupplies(supplyId),
            ]);
            setOrder(orderData);
            setSupplies(suppliesData);
        } catch (e) {
            setError(L.LOAD_FAILED);
        } finally {
            setLoading(false);
        }
    }, [supplyId]);

    useEffect(() => { loadData(); }, [loadData]);

    const subtle = isDark ? 'rgba(230,237,243,0.65)' : '#5A6878';

    const leftBg  = isDark ? DS.secondaryOne.dark : DS.secondaryOne.light;
    const rightBg = isDark ? DS.secondaryTwo.dark : DS.secondaryTwo.light;
    const action  = isDark ? DS.action.dark : DS.action.light;
    const actionHover = isDark ? DS.actionHover.dark : DS.actionHover.light;

    const handleDeliverySubmit = async ({ deliverySum: _ignored, ...data }) => {
        try {
            const created = await createOrderSupply(supplyId, data);
            // Додаємо нову поставку в стан без рефетчу supplies
            setSupplies(prev => [created, ...prev]);
            // Рефетч order — тригер міг оновити status та suppliedQuantity
            const updatedOrder = await fetchComponentOrderDetail(supplyId);
            setOrder(updatedOrder);
            setCreateOpen(false);
            setSnackbar({ open: true, message: L.DELIVERY_CREATED, severity: 'success' });
        } catch (e) {
            const resp = e?.response?.data;
            const msg = resp?.error || resp?.message || e?.message || L.DELIVERY_ERR;
            setSnackbar({ open: true, message: msg, severity: 'error' });
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteComponentOrder(supplyId);
            setDeleteDialogOpen(false);
            setSnackbar({ open: true, message: L.ORDER_DELETED, severity: 'success' });
            setTimeout(() => navigate('/supplies/active'), 1200);
        } catch (e) {
            const msg = e?.response?.data?.message;
            setDeleteDialogOpen(false);
            setSnackbar({ open: true, message: msg || L.ORDER_DELETE_FAILED, severity: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300 }}>
                <CircularProgress/>
            </Box>
        );
    }

    if (error || !order) {
        return (
            <Box sx={{ p:3 }}>
                <Button startIcon={<ArrowBackIcon/>} size="small" variant="text"
                    onClick={() => navigate('/supplies/active')}
                    sx={{ mb:2, color:'text.secondary', fontSize:'0.8rem' }}>
                    {L.BACK}
                </Button>
                <Typography color="error">{error || L.NOT_FOUND}</Typography>
            </Box>
        );
    }

    const totalSupplied = order.items.reduce((s, i) => s + i.suppliedQuantity, 0);
    const totalOrdered  = order.items.reduce((s, i) => s + i.orderedQuantity, 0);

    return (
        <>
        <Box sx={{ width:'100%' }}>
            {/* ── Back ── */}
            <Button
                startIcon={<ArrowBackIcon/>} size="small" variant="text"
                onClick={() => navigate('/supplies/active')}
                sx={{ mb:1.5, color:'text.secondary', fontSize:'0.8rem' }}
            >
                {L.BACK}
            </Button>

            {/* ── Header ── */}
            <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', mb:1.5, gap:2 }}>
                <Box>
                    <Typography fontWeight={700} sx={{ fontSize:'1.2rem', mb:0.2 }}>
                        {L.PAGE_TITLE}: {order.orderNumber}
                    </Typography>
                    <Typography sx={{ fontSize:'0.82rem', color: subtle, lineHeight:1.6 }}>
                        {L.ORDER_DATE}: {formatDate(order.orderDate)}
                        {order.expectedExecutionDate && <>&nbsp;&nbsp;|&nbsp;&nbsp;{L.EXPECTED_DATE}: {formatDate(order.expectedExecutionDate)}</>}
                        &nbsp;&nbsp;|&nbsp;&nbsp;{L.SUPPLIER}:{' '}
                        <strong style={{ color: isDark ? '#E3F2FD' : '#1E2A36' }}>{order.supplierName}</strong>
                    </Typography>
                </Box>
                <Box sx={{ display:'flex', gap:1, flexShrink:0, mt:0.3 }}>
                    <Tooltip
                        title={supplies.length > 0 ? L.EDIT_DISABLED_TOOLTIP : ''}
                        placement="bottom"
                    >
                        <span>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<EditIcon/>}
                                disabled={supplies.length > 0}
                                onClick={() => setEditModalOpen(true)}
                                sx={{ fontSize:'0.78rem' }}
                            >
                                {L.EDIT}
                            </Button>
                        </span>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon/>}
                        onClick={() => setDeleteDialogOpen(true)}
                        sx={{ fontSize:'0.78rem' }}
                    >
                        {L.DELETE}
                    </Button>
                </Box>
            </Box>

            {/* ── Two-panel layout ── */}
            <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:2, alignItems:'start' }}>

                {/* ── Left: ordered items ── */}
                <Box
                    sx={{
                        minWidth: 0,
                        bgcolor: leftBg,
                        border:'1px solid',
                        borderColor: isDark ? 'rgba(144,202,249,0.2)' : '#BBDEFB',
                        borderRadius:2,
                        p:1.5,
                    }}
                >
                    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.8 }}>
                        <Typography sx={{ fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: subtle }}>
                            {L.ORDERED_ITEMS_TITLE}
                        </Typography>
                        <Chip
                            label={`${totalSupplied} / ${totalOrdered} ${L.PCS}`}
                            size="small"
                            sx={{ fontSize:'0.72rem', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#BBDEFB', color: isDark ? '#90CAF9' : '#0D47A1' }}
                        />
                    </Box>

                    <LinearProgress
                        variant="determinate"
                        value={totalOrdered ? Math.round((totalSupplied / totalOrdered) * 100) : 0}
                        sx={{
                            mb:1.2, height:5, borderRadius:3,
                            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#BBDEFB',
                            '& .MuiLinearProgress-bar': { bgcolor: '#1976D2', borderRadius:3 },
                        }}
                    />

                    {order.items.map(item => (
                        <OrderedItemCard
                            key={item.id}
                            item={{ ...item, deliveries: deriveItemDeliveries(supplies, item.id) }}
                            isDark={isDark}
                            L={L}
                        />
                    ))}
                </Box>

                {/* ── Right: deliveries / create form ── */}
                <Box
                    sx={{
                        minWidth: 0,
                        bgcolor: rightBg,
                        border:'1px solid',
                        borderColor: isDark ? 'rgba(206,147,216,0.2)' : '#E1BEE7',
                        borderRadius:2,
                        p:1.5,
                        display:'flex',
                        flexDirection:'column',
                        minHeight:400,
                    }}
                >
                    {/* Panel header */}
                    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1.5, flexShrink:0 }}>
                        <Typography sx={{ fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: subtle }}>
                            {L.DELIVERIES_TITLE}
                        </Typography>
                        {!createOpen ? (
                            <Button
                                variant="contained" size="small" startIcon={<AddIcon/>}
                                onClick={() => setCreateOpen(true)}
                                sx={{ fontSize:'0.78rem', bgcolor: action, '&:hover':{ bgcolor: actionHover } }}
                            >
                                {L.CREATE_DELIVERY}
                            </Button>
                        ) : (
                            <IconButton size="small" onClick={() => setCreateOpen(false)}>
                                <CloseIcon fontSize="small"/>
                            </IconButton>
                        )}
                    </Box>

                    {/* Content: either list or form */}
                    {createOpen ? (
                        <CreateDeliveryForm
                            orderItems={order.items}
                            onSubmit={handleDeliverySubmit}
                            onCancel={() => setCreateOpen(false)}
                            isDark={isDark}
                            L={L}
                        />
                    ) : supplies.length === 0 ? (
                        <Typography sx={{ fontSize:'0.8rem', color: subtle, fontStyle:'italic', textAlign:'center', py:4 }}>
                            {L.NO_DELIVERIES}
                        </Typography>
                    ) : (
                        supplies.map(d => (
                            <DeliveryCard key={d.id} delivery={d} isDark={isDark} L={L}/>
                        ))
                    )}
                </Box>
            </Box>
        </Box>

        <ComponentOrderModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            editOrder={order}
            onOrderUpdated={loadData}
        />

        <Dialog
            open={deleteDialogOpen}
            onClose={() => !deleting && setDeleteDialogOpen(false)}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle sx={{ fontWeight: 700, color: 'text.primary' }}>
                {L.DELETE_TITLE}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {L.DELETE_BODY_PREFIX} <strong>{order?.orderNumber}</strong> {L.DELETE_BODY_SUFFIX}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    size="small"
                    variant="text"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleting}
                    sx={{ color: 'text.secondary' }}
                >
                    {L.CANCEL}
                </Button>
                <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={handleDelete}
                    disabled={deleting}
                    startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}
                >
                    {deleting ? L.DELETING : L.DELETE}
                </Button>
            </DialogActions>
        </Dialog>
        <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar(s => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert
                severity={snackbar.severity}
                variant="filled"
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                sx={{ width: '100%' }}
            >
                {snackbar.message}
            </Alert>
        </Snackbar>
        </>
    );
};

export default ComponentOrderDetailPage;
