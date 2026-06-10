import React from 'react';
import {
    Box,
    Typography,
    Chip,
    Divider,
    Paper,
    TextField,
    Button,
    useTheme,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { STATUS_CONFIG } from '../statusConfig';

const OrderCard = ({ order, labels }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const config = STATUS_CONFIG[order.status];
    const routeId = order.routeId ?? order.id;
    // Display the original status string from the DB — not translated
    const statusLabel = order.statusLabel;
    // Use lighter chip text in dark mode for legibility on dark card backgrounds
    const resolvedChipColor = isDark ? config.chipColorDark : config.chipColor;

    return (
        <Paper
            elevation={3}
            sx={{
                bgcolor: config.bgColor,
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxShadow: '0px 2px 8px 4px rgba(159,159,159,0.4)',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0px 6px 16px 4px rgba(159,159,159,0.5)',
                },
            }}
        >
            {/* Status chip */}
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
                <Chip
                    label={statusLabel}
                    size="small"
                    sx={{
                        bgcolor: config.chipBg,
                        color: resolvedChipColor,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                    }}
                />
            </Box>

            <Box sx={{ px: 2, pb: 1, flexGrow: 1 }}>
                {/* Order number */}
                <Typography variant="body1" fontWeight={700} sx={{ mb: 0.25, fontSize: '0.95rem' }}>
                    {labels.ORDER_NUMBER_LABEL}: {order.id}
                </Typography>

                {/* Created at */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25, fontSize: '0.78rem' }}>
                    {labels.CREATED_AT_LABEL}: {order.createdAt}
                </Typography>

                {/* Amount — may be null if not yet estimated */}
                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, fontSize: '0.88rem' }}>
                    {labels.ORDER_AMOUNT_LABEL}:{' '}
                    {order.amount != null
                        ? `${order.amount.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ${labels.CURRENCY}`
                        : '—'}
                </Typography>

                {/* Serial number */}
                <Typography variant="body2" sx={{ mb: 0.25, fontSize: '0.82rem' }}>
                    {labels.SERIAL_NUMBER_LABEL}: {order.serialNumber}
                </Typography>

                {/* Device info */}
                <Typography variant="body2" sx={{ mb: 1, fontSize: '0.82rem' }}>
                    {order.deviceInfo}
                </Typography>

                <Divider sx={{ mb: 1 }} />

                {/* Problem description — read-only */}
                <TextField
                    label={labels.PROBLEM_DESCRIPTION_LABEL}
                    value={order.description}
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                    variant="outlined"
                    slotProps={{
                        htmlInput: { readOnly: true },
                    }}
                    sx={{
                        mb: 1.5,
                        '& .MuiInputBase-input': { fontSize: '0.78rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                        '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' },
                    }}
                />
            </Box>

            {/* Details button */}
            <Box sx={{ px: 2, pb: 2 }}>
                <Button
                    variant="contained"
                    fullWidth
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(`/repairs/${routeId}`)}
                    sx={{
                        py: 1,
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' },
                    }}
                >
                    {labels.DETAILS_BUTTON}
                </Button>
            </Box>
        </Paper>
    );
};

export default OrderCard;
