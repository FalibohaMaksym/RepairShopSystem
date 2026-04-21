import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Paper, Snackbar, Typography } from '@mui/material';
import { fetchOrderRepairs, finishRepair, pauseRepair } from '../../../services/ordersService';
import RepairItem from './RepairItem';

// ─── Styles ───────────────────────────────────────────────────────────────────

const panelSx = {
    p: { xs: 1.8, md: 2.2 },
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.15)' : '#C8D8E7',
    border: '1px solid',
    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.4)' : '#b2c5d6',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.16)',
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Repairs block shown after repair confirmation
 * (statuses: AWAITING_REPAIR, IN_REPAIR, READY_FOR_PICKUP).
 *
 * Loads real data from GET /api/orders/{orderNumber}/repairs.
 * Masters get full interaction; admins see read-only data.
 *
 * Props:
 *   labels      — ORDER_DETAILS i18n section
 *   isMaster    — boolean
 *   orderNumber — string
 */
const RepairsPanel = ({ labels, isMaster, orderNumber, deviceTypeName, onOrderStatusChanged }) => {
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const finishingRef = useRef(new Set());
    const [expandedIds, setExpandedIds] = useState(new Set());

    const toggleExpanded = (repairId) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(repairId)) next.delete(repairId);
            else next.add(repairId);
            return next;
        });
    };

    const loadRepairs = async () => {
        if (!orderNumber) return;

        setLoading(true);
        setFetchError(null);
        try {
            const data = await fetchOrderRepairs(orderNumber);
            setRepairs(data);
        } catch (err) {
            setFetchError(err.response?.data?.error || err.message || labels.LOAD_FAILED);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRepairs();
    }, [orderNumber, labels.LOAD_FAILED]);

    const handlePauseRepair = async (repairId) => {
        try {
            await pauseRepair(orderNumber, repairId);
            setSnackbar({ open: true, message: labels.REPAIR_PAUSE_SUCCESS, severity: 'success' });
            // Primary effect: ORDER status changes "в ремонті" → "очікує ремонту".
            // Reload both the order (status chip) and repairs list.
            onOrderStatusChanged?.();
            await loadRepairs();
        } catch (err) {
            const status = err.response?.status;
            let msg = labels.REPAIR_PAUSE_FAILED;
            if (status === 404) msg = labels.REPAIR_PAUSE_ERROR_NOT_FOUND ?? msg;
            if (status === 409) msg = labels.REPAIR_PAUSE_ERROR_CONFLICT ?? msg;
            setSnackbar({ open: true, message: msg, severity: 'error' });
        }
    };

    const resolveFinishRepairError = (err) => {
        const status = err.response?.status;
        const serverMsg = (err.response?.data?.error || err.response?.data?.message || '').toLowerCase();

        if (status === 404) return labels.REPAIR_FINISH_ERROR_NOT_FOUND;
        if (status === 409) {
            if (serverMsg.includes('не розпочато') || serverMsg.includes('not started')) {
                return labels.REPAIR_FINISH_ERROR_NOT_STARTED;
            }
            return labels.REPAIR_FINISH_ERROR_ALREADY_FINISHED;
        }
        return labels.REPAIR_FINISH_ERROR_GENERIC;
    };

    const handleFinishRepair = async (repairId) => {
        if (finishingRef.current.has(repairId)) return;
        finishingRef.current.add(repairId);

        try {
            const updated = await finishRepair(orderNumber, repairId);
            // Merge returned status/dates into existing repair, keeping nested services intact.
            setRepairs((prev) => {
                const next = prev.map((r) =>
                    r.id === repairId
                        ? { ...r, statusKey: updated.statusKey, finishedAt: updated.finishedAt }
                        : r
                );
                // If all repairs are now finished, the order status has likely changed — refresh.
                if (next.every((r) => r.statusKey === 'FINISHED')) {
                    onOrderStatusChanged?.();
                }
                return next;
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: resolveFinishRepairError(err),
                severity: 'error',
            });
        } finally {
            finishingRef.current.delete(repairId);
        }
    };

    return (
        <Paper sx={panelSx}>
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 500,
                    mb: 1.4,
                    display: 'inline-flex',
                    px: 0.8,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                {labels.REPAIRS_SECTION_TITLE}
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : fetchError ? (
                <Alert severity="error" sx={{ mt: 1 }}>{fetchError}</Alert>
            ) : repairs.length === 0 ? (
                <Typography color="text.secondary">{labels.REPAIRS_NOT_PERFORMED}</Typography>
            ) : (
                <Box>
                    {repairs.map((repair) => (
                        <RepairItem
                            key={repair.id}
                            repair={repair}
                            isMaster={isMaster}
                            labels={labels}
                            deviceTypeName={deviceTypeName}
                            orderNumber={orderNumber}
                            onFinishRepair={handleFinishRepair}
                            onPauseRepair={handlePauseRepair}
                            onServicePlanned={loadRepairs}
                            expanded={expandedIds.has(repair.id)}
                            onToggleExpanded={() => toggleExpanded(repair.id)}
                        />
                    ))}
                </Box>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
        </Paper>
    );
};

export default RepairsPanel;
