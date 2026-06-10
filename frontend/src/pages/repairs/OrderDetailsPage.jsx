import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../app/auth/AuthContext';
import { APP_ROLES, normalizeRole } from '../../app/auth/roleUtils';
import { useLanguage } from '../../app/i18n/LanguageContext';
import {
    deleteOrder,
    downloadOrderTicket,
    fetchOrderChildren,
    fetchOrderDetails,
    fetchOrderDiagnostic,
    saveOrderDiagnosticDraft,
    startOrderDiagnostic,
    finishOrderDiagnostic,
    completeOrder,
} from '../../services/ordersService';
import OrderDetailsHeader from './components/OrderDetailsHeader';
import StaticInfoCards from './components/StaticInfoCards';
import DynamicOrderSections from './components/DynamicOrderSections';
import MasterDiagnosticPanel from './components/MasterDiagnosticPanel';
import AdminRepairPlanningPanel from './components/AdminRepairPlanningPanel';
import RepairsPanel from './components/RepairsPanel';
import DiagnosticsPanelErrorBoundary from './components/DiagnosticsPanelErrorBoundary';
import { detailsColumnsSx, detailsColumnSx } from './OrderDetailsPage.styles';

const saveBlobWithSystemDialog = async (blob, fileName) => {
    if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
                {
                    description: 'PDF files',
                    accept: { 'application/pdf': ['.pdf'] },
                },
            ],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
};

const OrderDetailsPage = () => {
    const { orderNumber } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { labels } = useLanguage();
    const L = labels.repairs.ORDER_DETAILS;
    const isMaster = normalizeRole(user?.role) === APP_ROLES.MASTER;

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [childrenFlags, setChildrenFlags] = useState({ hasDiagnostic: false, hasRepair: false });
    const [diagnosticData, setDiagnosticData] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [ticketLoading, setTicketLoading] = useState(false);
    const [startDiagnosticLoading, setStartDiagnosticLoading] = useState(false);
    const [finishDiagnosticLoading, setFinishDiagnosticLoading] = useState(false);
    const [draftDiagnosticSaving, setDraftDiagnosticSaving] = useState(false);
    const [completeOrderLoading, setCompleteOrderLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);


    const loadOrder = async () => {
        setLoading(true);
        setFetchError(null);

        const normalizedOrderNumber = String(orderNumber || '').trim();
        if (!normalizedOrderNumber) {
            setFetchError(L.INVALID_ORDER_NUMBER);
            setLoading(false);
            return;
        }

        try {
            const [data, children] = await Promise.all([
                fetchOrderDetails(normalizedOrderNumber),
                fetchOrderChildren(normalizedOrderNumber),
            ]);
            setOrder(data);
            setChildrenFlags(children);

            if (children.hasDiagnostic) {
                try {
                    const diagnostic = await fetchOrderDiagnostic(normalizedOrderNumber);
                    setDiagnosticData(diagnostic);
                } catch (diagnosticError) {
                    setDiagnosticData(null);
                }
            } else {
                setDiagnosticData(null);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setFetchError(L.ORDER_NOT_FOUND);
            } else {
                setFetchError(err.response?.data?.error || err.message || L.LOAD_FAILED);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrder();
    }, [orderNumber, L.INVALID_ORDER_NUMBER, L.LOAD_FAILED, L.ORDER_NOT_FOUND]);

    const headerData = useMemo(() => ({
        orderNumber: order?.orderNumber ?? orderNumber,
        createdBy: order?.createdBy || L.UNKNOWN_VALUE,
        createdAt: order?.createdAt || L.UNKNOWN_VALUE,
        statusKey: order?.status || 'NEW',
        status: order?.statusLabel || L.UNKNOWN_VALUE,
    }), [order, orderNumber, L.UNKNOWN_VALUE]);

    const isTicketStage = headerData.statusKey === 'NEW' && !childrenFlags.hasDiagnostic;
    const showHeaderActionButton = !isMaster && isTicketStage;
    const isAdminOrSeniorAdmin = [APP_ROLES.ADMIN, APP_ROLES.SENIOR_ADMIN].includes(normalizeRole(user?.role));
    const canDeleteOrder = [APP_ROLES.ADMIN, APP_ROLES.SENIOR_ADMIN, APP_ROLES.SYSTEM_ADMIN].includes(normalizeRole(user?.role));
    const showDeleteButton = canDeleteOrder && headerData.statusKey === 'NEW';
    const showCompleteOrderButton = isAdminOrSeniorAdmin && headerData.statusKey === 'READY_FOR_PICKUP';
    const isDiagnosticOwnedByCurrentMaster = Number(diagnosticData?.workerId) === Number(user?.workerId);
    const showMasterDiagnosticPanel = isMaster
        && headerData.statusKey === 'DIAGNOSTICS'
        && childrenFlags.hasDiagnostic
        && isDiagnosticOwnedByCurrentMaster;
    const showAdminRepairPlanningPanel = isAdminOrSeniorAdmin
        && headerData.statusKey === 'AWAITING_CONFIRMATION'
        && childrenFlags.hasDiagnostic;

    // Repairs block — shown whenever the order is in a repair stage, regardless of whether
    // repair records exist yet (they may be created later by the master).
    const showRepairsPanel = ['AWAITING_REPAIR', 'IN_REPAIR', 'READY_FOR_PICKUP'].includes(
        headerData.statusKey
    );

    const handlePrimaryAction = async () => {
        if (!isTicketStage || !headerData.orderNumber || ticketLoading) return;

        setTicketLoading(true);

        try {
            const { blob, fileName } = await downloadOrderTicket(headerData.orderNumber);
            await saveBlobWithSystemDialog(blob, fileName);
            setSnackbar({ open: true, message: L.TICKET_DOWNLOAD_SUCCESS, severity: 'success' });
        } catch (err) {
            if (err.name === 'AbortError') {
                return;
            }

            const apiError = err.response?.data?.error;
            setSnackbar({ open: true, message: apiError || err.message || L.TICKET_DOWNLOAD_FAILED, severity: 'error' });
        } finally {
            setTicketLoading(false);
        }
    };

    const handleStartDiagnostic = async () => {
        if (!headerData.orderNumber || startDiagnosticLoading) return;

        setStartDiagnosticLoading(true);

        try {
            const [diagnostic, updatedOrder] = await Promise.all([
                startOrderDiagnostic(headerData.orderNumber),
                fetchOrderDetails(headerData.orderNumber),
            ]);

            setDiagnosticData(diagnostic);
            setChildrenFlags((prev) => ({ ...prev, hasDiagnostic: true }));
            setOrder({
                ...updatedOrder,
                status: 'DIAGNOSTICS',
                statusLabel: L.STATUS_DIAGNOSTICS,
            });
            setSnackbar({ open: true, message: L.DIAGNOSTIC_START_SUCCESS, severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || err.message || L.DIAGNOSTIC_START_FAILED, severity: 'error' });
        } finally {
            setStartDiagnosticLoading(false);
        }
    };

    const handleFinishDiagnostic = async ({ reason, solution, defects }) => {
        if (!headerData.orderNumber || finishDiagnosticLoading) return;

        setFinishDiagnosticLoading(true);

        try {
            const updated = await finishOrderDiagnostic(headerData.orderNumber, {
                defectReason: reason || null,
                defectSolution: solution || null,
                defectIds: defects.map((d) => d.id).filter(Boolean),
            });

            setDiagnosticData(updated);
            setSnackbar({ open: true, message: L.DIAGNOSTIC_FINISH_SUCCESS, severity: 'success' });
            // Reload order data AFTER diagnostic is committed so the status reflects the change.
            await loadOrder();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || err.message || L.DIAGNOSTIC_FINISH_FAILED, severity: 'error' });
        } finally {
            setFinishDiagnosticLoading(false);
        }
    };

    const handleSaveDiagnosticDraft = async ({ reason, solution, defects }) => {
        if (!headerData.orderNumber) return null;

        setDraftDiagnosticSaving(true);
        try {
            const updated = await saveOrderDiagnosticDraft(headerData.orderNumber, {
                defectReason: reason || null,
                defectSolution: solution || null,
                defectIds: defects.map((d) => d.id).filter(Boolean),
            });

            setDiagnosticData(updated);
            return updated;
        } finally {
            setDraftDiagnosticSaving(false);
        }
    };

    // Refetch order details + children after a repair planning action so the
    // page reflects the new status set by the DB trigger.
    const reloadOrderAfterRepairAction = async () => {
        const normalizedOrderNumber = String(orderNumber || '').trim();
        if (!normalizedOrderNumber) return;

        try {
            const [data, children] = await Promise.all([
                fetchOrderDetails(normalizedOrderNumber),
                fetchOrderChildren(normalizedOrderNumber),
            ]);
            setOrder(data);
            setChildrenFlags(children);
        } catch {
            // Non-critical: the snackbar inside the panel already shows the result.
        }
    };

    const handleRepairsConfirmed = () => {
        reloadOrderAfterRepairAction();
    };

    const handleRepairDeclined = () => {
        reloadOrderAfterRepairAction();
    };

    const handleCompleteOrder = async () => {
        if (!headerData.orderNumber || completeOrderLoading) return;

        setCompleteOrderLoading(true);

        try {
            await completeOrder(headerData.orderNumber);
            setSnackbar({ open: true, message: L.ORDER_COMPLETE_SUCCESS, severity: 'success' });
            // Reload order so the status chip and page layout reflect the new status.
            const [data, children] = await Promise.all([
                fetchOrderDetails(headerData.orderNumber),
                fetchOrderChildren(headerData.orderNumber),
            ]);
            setOrder(data);
            setChildrenFlags(children);
        } catch (err) {
            const status = err.response?.status;
            const msg = status === 403
                ? L.ORDER_COMPLETE_WRONG_STATUS
                : (err.response?.data?.error || err.message || L.ORDER_COMPLETE_FAILED);
            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally {
            setCompleteOrderLoading(false);
        }
    };

    const handleDeleteOrder = async () => {
        if (!headerData.orderNumber || deleteLoading) return;

        setDeleteLoading(true);
        try {
            await deleteOrder(headerData.orderNumber);
            setDeleteDialogOpen(false);
            setSnackbar({ open: true, message: L.ORDER_DELETE_SUCCESS, severity: 'success' });
            // Невелика затримка щоб снекбар встиг показатись перед навігацією
            setTimeout(() => navigate('/repairs/active'), 1500);
        } catch (err) {
            setDeleteDialogOpen(false);
            const status = err.response?.status;
            const msg =
                status === 403
                    ? (err.response?.data?.error || L.ORDER_DELETE_FORBIDDEN)
                    : (err.response?.data?.error || err.message || L.ORDER_DELETE_FAILED);
            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally {
            setDeleteLoading(false);
        }
    };

    const deviceInfo = useMemo(() => {
        const modelParts = [order?.deviceInfo?.typeName, order?.deviceInfo?.producerName, order?.deviceInfo?.model]
            .filter(Boolean)
            .join(', ');

        return {
            serialNumber: order?.deviceInfo?.serialNumber || L.UNKNOWN_VALUE,
            deviceInfo: modelParts || L.UNKNOWN_VALUE,
            outerState: order?.deviceInfo?.outerState || L.UNKNOWN_VALUE,
            additionalInfo: order?.deviceInfo?.additionalInfo || L.NO_ADDITIONAL_INFO,
            problemDescription: order?.problemDescription || L.UNKNOWN_VALUE,
        };
    }, [
        order,
        L.UNKNOWN_VALUE,
        L.NO_ADDITIONAL_INFO,
    ]);

    const customerInfo = useMemo(() => ({
        fullName: order?.customerInfo?.fullName || L.UNKNOWN_VALUE,
        phoneNumber: order?.customerInfo?.phoneNumber || L.UNKNOWN_VALUE,
        email: order?.customerInfo?.email || L.UNKNOWN_VALUE,
    }), [order, L.UNKNOWN_VALUE]);

    // Dynamic blocks by requirement. Exact behavior will be added with backend APIs.
    const diagnosticsSection = {
        id: 'diagnostics',
        variant: 'diagnostics',
        title: L.DIAGNOSTICS_SECTION_TITLE,
        fields: childrenFlags.hasDiagnostic ? [
            {
                label: L.DIAGNOSTIC_REASON,
                value: diagnosticData?.defectReason || L.UNKNOWN_VALUE,
            },
            {
                label: L.DIAGNOSTIC_SOLUTION,
                value: diagnosticData?.defectSolution || L.UNKNOWN_VALUE,
            },
            {
                label: L.DIAGNOSTIC_STARTED_AT,
                value: diagnosticData?.diagnosticStartedAt || L.UNKNOWN_VALUE,
            },
            {
                label: L.DIAGNOSTIC_FINISHED_AT,
                value: diagnosticData?.diagnosticFinishedAt || L.UNKNOWN_VALUE,
            },
            {
                label: L.DIAGNOSTIC_WORKER,
                value: diagnosticData?.workerFullName || L.UNKNOWN_VALUE,
            },
        ] : undefined,
        listTitle: childrenFlags.hasDiagnostic ? L.DIAGNOSTIC_DEFECTS : undefined,
        listItems: childrenFlags.hasDiagnostic
            ? (
                diagnosticData?.defects?.length
                    ? diagnosticData.defects.map((defect) => defect?.name || L.UNKNOWN_VALUE)
                    : [diagnosticData?.diagnosticFinishedAt ? L.DIAGNOSTIC_NO_DEFECTS_AFTER_FINISH : L.DIAGNOSTIC_NO_DEFECTS]
            )
            : undefined,
        note: childrenFlags.hasDiagnostic ? undefined : L.DIAGNOSTICS_NOT_PERFORMED,
        actionButton: (!childrenFlags.hasDiagnostic && isMaster)
            ? {
                label: startDiagnosticLoading ? L.START_DIAGNOSTIC_LOADING_BUTTON : L.START_DIAGNOSTIC_BUTTON,
                onClick: handleStartDiagnostic,
                disabled: startDiagnosticLoading,
                sx: {
                    bgcolor: '#B8A6D9',
                    color: '#2B1F45',
                    '&:hover': { bgcolor: '#A48BCF' },
                },
            }
            : undefined,
    };

    const repairsSection = {
        id: 'repairs',
        variant: 'repairs',
        title: L.REPAIRS_SECTION_TITLE,
        note: childrenFlags.hasRepair ? L.DYNAMIC_SECTION_NOTE : L.REPAIRS_NOT_PERFORMED,
    };

    if (loading) {
        return (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={24} />
                <Typography color="text.secondary">{L.LOADING}</Typography>
            </Box>
        );
    }

    if (fetchError) {
        return (
            <Alert severity="error" sx={{ mt: 1.5 }}>
                {fetchError}
            </Alert>
        );
    }

    return (
        <Box>
            <OrderDetailsHeader
                labels={L}
                orderNumber={headerData.orderNumber}
                createdBy={headerData.createdBy}
                createdAt={headerData.createdAt}
                statusKey={headerData.statusKey}
                status={headerData.status}
                deleteButton={
                    showDeleteButton
                        ? {
                            label: L.DELETE_ORDER_BUTTON,
                            onClick: () => setDeleteDialogOpen(true),
                            disabled: deleteLoading,
                        }
                        : undefined
                }
                actionButton={
                    showCompleteOrderButton
                        ? {
                            label: completeOrderLoading ? L.COMPLETING_ORDER_BUTTON : L.COMPLETE_ORDER_BUTTON,
                            onClick: handleCompleteOrder,
                            disabled: completeOrderLoading,
                            sx: {
                                px: 3,
                                bgcolor: '#2E7D32',
                                color: '#fff',
                                '&:hover': { bgcolor: '#1B5E20' },
                            },
                        }
                        : showHeaderActionButton
                            ? {
                                label: ticketLoading ? L.GENERATING_TICKET_BUTTON : L.GENERATE_TICKET_BUTTON,
                                onClick: handlePrimaryAction,
                                disabled: ticketLoading,
                                sx: {
                                    px: 3,
                                    bgcolor: '#B8A6D9',
                                    color: '#2B1F45',
                                    '&:hover': { bgcolor: '#A48BCF' },
                                },
                            }
                            : undefined
                }
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
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

            {/* ── Delete confirmation dialog ── */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ pb: 1, color: 'text.primary' }}>
                    {L.ORDER_DELETE_DIALOG_TITLE}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        {L.ORDER_DELETE_DIALOG_TEXT}{' '}
                        <Typography component="span" fontWeight={700}>
                            #{headerData.orderNumber}
                        </Typography>
                        ?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {L.ORDER_DELETE_DIALOG_NOTE_IRREVERSIBLE}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleteLoading}
                    >
                        {L.ORDER_DELETE_DIALOG_CANCEL}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteOrder}
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {deleteLoading ? L.ORDER_DELETE_DIALOG_DELETING : L.ORDER_DELETE_DIALOG_CONFIRM}
                    </Button>
                </DialogActions>
            </Dialog>

            <Box sx={detailsColumnsSx}>
                <Box sx={detailsColumnSx}>
                    <StaticInfoCards labels={L} deviceInfo={deviceInfo} mode="device" />
                    {showMasterDiagnosticPanel ? (
                        <DiagnosticsPanelErrorBoundary fallback={<DynamicOrderSections sections={[diagnosticsSection]} singleColumn />}>
                            <MasterDiagnosticPanel
                                labels={L}
                                diagnosticData={diagnosticData}
                                onFinishDiagnostic={handleFinishDiagnostic}
                                onSaveDiagnosticDraft={handleSaveDiagnosticDraft}
                                isDraftSaving={draftDiagnosticSaving}
                                isFinishing={finishDiagnosticLoading}
                            />
                        </DiagnosticsPanelErrorBoundary>
                    ) : (
                        <DynamicOrderSections sections={[diagnosticsSection]} singleColumn />
                    )}
                </Box>

                <Box sx={detailsColumnSx}>
                    <StaticInfoCards labels={L} customerInfo={customerInfo} mode="customer" />
                    {showRepairsPanel ? (
                        <RepairsPanel
                            labels={L}
                            isMaster={isMaster}
                            orderNumber={headerData.orderNumber}
                            deviceTypeName={order?.deviceInfo?.typeName || ''}
                            onOrderStatusChanged={loadOrder}
                        />
                    ) : showAdminRepairPlanningPanel ? (
                        <AdminRepairPlanningPanel
                            labels={L}
                            orderNumber={headerData.orderNumber}
                            onRepairsConfirmed={handleRepairsConfirmed}
                            onRepairDeclined={handleRepairDeclined}
                        />
                    ) : (
                        <DynamicOrderSections sections={[repairsSection]} singleColumn />
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default OrderDetailsPage;
