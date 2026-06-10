import React, { useState } from 'react';
import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Divider,
    IconButton,
    Link,
    Snackbar,
    Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ServicePlanningForm from './ServicePlanningForm';
import StockTransferModal from '../../supplies/components/StockTransferModal';
import { startRepairService, finishRepairService, updateRepairService } from '../../../services/ordersService';

const fmtPrice = (value) =>
    Number(value).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const buildComponentLine = (component) => {
    const parts = [component.categoryName, component.producerName, component.name]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);

    return parts.join(' ');
};

const resolveStartServiceError = (error, labels) => {
    const status = error?.response?.status;
    const backendMessage = error?.response?.data?.message || error?.response?.data?.error || '';
    const normalizedMessage = String(backendMessage).toLowerCase();

    if (status === 404) {
        return {
            title: labels?.SERVICE_START_ERROR_TITLE || 'Помилка запуску послуги',
            message: labels?.SERVICE_START_ERROR_NOT_FOUND
                || 'Послугу не знайдено або вона не належить до вказаного ремонту/замовлення.',
        };
    }

    if (status === 409) {
        if (normalizedMessage.includes('already') || normalizedMessage.includes('уже') || normalizedMessage.includes('вже')) {
            return {
                title: labels?.SERVICE_START_ERROR_TITLE || 'Помилка запуску послуги',
                message: labels?.SERVICE_START_ERROR_ALREADY_STARTED || 'Послугу вже розпочато.',
            };
        }

        if (normalizedMessage.includes('stock') || normalizedMessage.includes('insufficient') || normalizedMessage.includes('комплектуюч') || normalizedMessage.includes('залишк')) {
            return {
                title: labels?.SERVICE_START_ERROR_TITLE || 'Помилка запуску послуги',
                message: labels?.SERVICE_START_ERROR_INSUFFICIENT_STOCK
                    || 'Недостатньо комплектуючих на складі для початку цієї послуги.',
            };
        }

        return {
            title: labels?.SERVICE_START_ERROR_TITLE || 'Помилка запуску послуги',
            message: labels?.SERVICE_START_ERROR_CONFLICT || 'Конфлікт стану під час запуску послуги.',
        };
    }

    if (status >= 500) {
        return {
            title: labels?.SERVICE_START_ERROR_TITLE || 'Помилка запуску послуги',
            message: labels?.SERVICE_START_ERROR_SERVER || 'Сервер тимчасово недоступний. Спробуйте пізніше.',
        };
    }

    return {
        title: labels?.SERVICE_START_ERROR_TITLE || 'Помилка запуску послуги',
        message:
            backendMessage
            || labels?.SERVICE_START_ERROR_GENERIC
            || 'Не вдалося розпочати послугу. Спробуйте ще раз.',
    };
};

const resolveFinishServiceError = (error, labels) => {
    const status = error?.response?.status;
    const backendMessage = error?.response?.data?.message || error?.response?.data?.error || '';
    const normalizedMessage = String(backendMessage).toLowerCase();

    if (status === 404) {
        return {
            title: labels?.SERVICE_FINISH_BUTTON || 'Завершення послуги',
            message: labels?.SERVICE_FINISH_ERROR_NOT_FOUND
                || 'Послугу не знайдено або вона не належить до вказаного ремонту/замовлення.',
        };
    }

    if (status === 409) {
        if (normalizedMessage.includes('не розпочато') || normalizedMessage.includes('not started')) {
            return {
                title: labels?.SERVICE_FINISH_BUTTON || 'Завершення послуги',
                message: labels?.SERVICE_FINISH_ERROR_NOT_STARTED || 'Послугу ще не розпочато — завершення неможливе.',
            };
        }
        return {
            title: labels?.SERVICE_FINISH_BUTTON || 'Завершення послуги',
            message: labels?.SERVICE_FINISH_ERROR_ALREADY_FINISHED || 'Послугу вже завершено.',
        };
    }

    if (status >= 500) {
        return {
            title: labels?.SERVICE_FINISH_BUTTON || 'Завершення послуги',
            message: labels?.SERVICE_FINISH_ERROR_SERVER || 'Сервер тимчасово недоступний. Спробуйте пізніше.',
        };
    }

    return {
        title: labels?.SERVICE_FINISH_BUTTON || 'Завершення послуги',
        message: backendMessage || labels?.SERVICE_FINISH_ERROR_GENERIC || 'Не вдалося завершити послугу. Спробуйте ще раз.',
    };
};

const resolveUpdateServiceError = (error, labels) => {
    const status = error?.response?.status;
    const backendMessage = error?.response?.data?.message || error?.response?.data?.error || '';

    if (status === 404) {
        return {
            title: labels?.SERVICE_EDIT_ERROR_TITLE || 'Помилка редагування послуги',
            message: labels?.SERVICE_EDIT_ERROR_NOT_FOUND
                || 'Послугу не знайдено або вона не належить до вказаного ремонту/замовлення.',
        };
    }

    if (status === 409) {
        return {
            title: labels?.SERVICE_EDIT_ERROR_TITLE || 'Помилка редагування послуги',
            message: labels?.SERVICE_EDIT_ERROR_ALREADY_STARTED
                || 'Редагування недоступне після початку надання послуги.',
        };
    }

    if (status >= 500) {
        return {
            title: labels?.SERVICE_EDIT_ERROR_TITLE || 'Помилка редагування послуги',
            message: labels?.SERVICE_EDIT_ERROR_SERVER || 'Сервер тимчасово недоступний. Спробуйте пізніше.',
        };
    }

    return {
        title: labels?.SERVICE_EDIT_ERROR_TITLE || 'Помилка редагування послуги',
        message:
            backendMessage
            || labels?.SERVICE_EDIT_ERROR_GENERIC
            || 'Не вдалося оновити послугу. Спробуйте ще раз.',
    };
};

// ─── Component card ────────────────────────────────────────────────────────────

const ComponentCard = ({ component, isMaster, labels, canMoveComponents, onMove }) => (
    <Box
        sx={{
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 1,
            p: 1.2,
            bgcolor: 'background.paper',
        }}
    >
        <Typography fontWeight={600} sx={{ fontSize: '0.9rem', mb: 0.6 }}>
            {buildComponentLine(component) || component.name}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}>
            <Box>
                <Typography variant="body2" color="text.secondary">
                    {labels.COMPONENT_PRICE_LABEL}: {fmtPrice(component.price)}
                </Typography>
                {isMaster && (
                    <Button
                        variant="contained"
                        size="small"
                        disabled={!canMoveComponents}
                        onClick={() => onMove?.(component)}
                        sx={{
                            mt: 0.8,
                            bgcolor: '#B874CE',
                            '&:hover': { bgcolor: '#A45DBB' },
                            fontSize: '0.76rem',
                        }}
                    >
                        {labels.COMPONENT_MOVE_BUTTON}
                    </Button>
                )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                    {labels.COMPONENT_REQUIRED_QTY_LABEL}: {component.requiredQuantity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {labels.COMPONENT_STOCK_QTY_LABEL}: {component.stockQuantity}
                </Typography>
            </Box>
        </Box>
    </Box>
);

// ─── Service item ──────────────────────────────────────────────────────────────

/**
 * Single service row inside a Repair. Always shows name, worker and dates;
 * expanding reveals required components and (for masters) action buttons.
 *
 * Props:
 *   service  — { id, name, workerName, startedAt, finishedAt, components[] }
 *   isMaster — boolean
 *   labels   — ORDER_DETAILS i18n section
 */
const RepairServiceItem = ({ service, isMaster, labels, orderNumber, repairId, onServiceRefresh }) => {
    const [expanded, setExpanded] = useState(false);
    const [editingOpen, setEditingOpen] = useState(false);
    const [startLoading, setStartLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [snackbarTitle, setSnackbarTitle] = useState('');
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [transferComponent, setTransferComponent] = useState(null);

    const isServiceStarted = Boolean(service.startedAt);
    const isServiceFinished = Boolean(service.finishedAt);
    const canMoveComponents = !isServiceStarted;
    const canEditService = !isServiceStarted;
    const canServiceAction = !isServiceFinished;
    const serviceActionLabel = isServiceStarted
        ? labels.SERVICE_FINISH_BUTTON
        : labels.SERVICE_START_BUTTON;

    /**
     * Handles service start — calls API, shows snackbar on success, alert dialog on error.
     */
    const handleStartService = async () => {
        setStartLoading(true);
        try {
            await startRepairService(orderNumber, repairId, service.id);
            setSnackbarTitle(labels.SERVICE_START_SUCCESS_TITLE || labels.SERVICE_START_BUTTON);
            setSnackbar({
                open: true,
                message: labels.SERVICE_START_SUCCESS_MESSAGE || 'Послугу успішно розпочато.',
                severity: 'success',
            });
            onServiceRefresh?.();
        } catch (error) {
            const resolvedError = resolveStartServiceError(error, labels);

            setSnackbarTitle(resolvedError.title);
            setSnackbar({
                open: true,
                message: resolvedError.message,
                severity: 'error',
            });
        } finally {
            setStartLoading(false);
        }
    };

    const handleEditServiceSubmit = async ({ workerServiceId, requiredComponents }) => {
        setEditLoading(true);
        try {
            await updateRepairService(orderNumber, repairId, service.id, {
                workerServiceId,
                components: (requiredComponents ?? []).map((item) => ({
                    componentId: item.id,
                    quantity: item.quantity,
                })),
            });

            setEditingOpen(false);
            setSnackbarTitle(labels.SERVICE_EDIT_SUCCESS_TITLE || labels.SERVICE_EDIT_BUTTON);
            setSnackbar({
                open: true,
                message: labels.SERVICE_EDIT_SUCCESS_MESSAGE || 'Послугу успішно оновлено.',
                severity: 'success',
            });
            onServiceRefresh?.();
        } catch (error) {
            const resolvedError = resolveUpdateServiceError(error, labels);
            setSnackbarTitle(resolvedError.title);
            setSnackbar({
                open: true,
                message: resolvedError.message,
                severity: 'error',
            });
            throw error;
        } finally {
            setEditLoading(false);
        }
    };

    const handleFinishService = async () => {
        setStartLoading(true);
        try {
            await finishRepairService(orderNumber, repairId, service.id);
            setSnackbarTitle(labels.SERVICE_FINISH_BUTTON);
            setSnackbar({
                open: true,
                message: labels.SERVICE_FINISH_SUCCESS_MESSAGE || 'Послугу успішно завершено.',
                severity: 'success',
            });
            onServiceRefresh?.();
        } catch (error) {
            const resolvedError = resolveFinishServiceError(error, labels);
            setSnackbarTitle(resolvedError.title);
            setSnackbar({
                open: true,
                message: resolvedError.message,
                severity: 'error',
            });
        } finally {
            setStartLoading(false);
        }
    };

    const handleServiceAction = async () => {
        if (isServiceStarted) {
            await handleFinishService();
            return;
        }

        await handleStartService();
    };

    const startedText = service.startedAt || labels.REPAIR_NOT_STARTED;
    const finishedText = service.finishedAt || labels.REPAIR_NOT_FINISHED;

    return (
        <Box
            sx={{
                border: '1px solid rgba(140,80,180,0.22)',
                borderRadius: 1.5,
                mb: 1,
                overflow: 'hidden',
                bgcolor: 'rgba(184,116,206,0.07)',
            }}
        >
            {/* Always-visible header (2 rows) */}
            <Box
                sx={{ p: 1.2, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                onClick={() => setExpanded((e) => !e)}
            >
                {/* Row 1: name | worker | arrow */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        alignItems: 'flex-start',
                        gap: 1,
                    }}
                >
                    <Typography fontWeight={700} sx={{ fontSize: '0.9rem' }}>
                        {service.name}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}
                    >
                        {labels.SERVICE_WORKER_LABEL}:{' '}
                        <Link
                            component="span"
                            underline="hover"
                            color="text.primary"
                            sx={{ fontWeight: 500, cursor: 'default' }}
                        >
                            {service.workerName}
                        </Link>
                    </Typography>
                    <IconButton size="small" sx={{ mt: '-2px', p: 0.3 }}>
                        {expanded
                            ? <ExpandMoreIcon fontSize="small" />
                            : <ChevronRightIcon fontSize="small" />
                        }
                    </IconButton>
                </Box>

                {/* Row 2: dates */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 0.4,
                        gap: 2,
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {labels.REPAIR_STARTED_AT_LABEL}: {startedText}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {labels.REPAIR_FINISHED_AT_LABEL}: {finishedText}
                    </Typography>
                </Box>
            </Box>

            {/* Expanded: components + actions */}
            {expanded && (
                <Box sx={{ px: 1.4, pb: 1.4, borderTop: '1px solid rgba(140,80,180,0.15)' }}>
                    {editingOpen ? (
                        <ServicePlanningForm
                            labels={labels}
                            deviceTypeName=""
                            orderNumber={orderNumber}
                            mode="edit"
                            initialWorkerServiceId={service.workerServiceId}
                            initialServiceName={service.name}
                            initialRequiredComponents={(service.components || []).map((component) => ({
                                id: component.id,
                                name: component.name,
                                categoryName: component.categoryName,
                                producerName: component.producerName,
                                price: component.price,
                                requiredQuantity: component.requiredQuantity,
                                stockQuantity: component.stockQuantity,
                                quantity: component.requiredQuantity,
                            }))}
                            submitLabel={labels.SERVICE_EDIT_SAVE_BUTTON || labels.SERVICE_FORM_SUBMIT_BUTTON}
                            cancelLabel={labels.SERVICE_EDIT_CANCEL_BUTTON || labels.SERVICE_FORM_CANCEL_BUTTON}
                            submitErrorFallback={labels.SERVICE_EDIT_ERROR_GENERIC || 'Не вдалося оновити послугу.'}
                            onCancel={() => setEditingOpen(false)}
                            onSubmit={handleEditServiceSubmit}
                        />
                    ) : (
                        <>
                            <Divider sx={{ my: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {labels.SERVICE_COMPONENTS_SECTION}
                                </Typography>
                            </Divider>

                            {service.components.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.2 }}>
                                    {labels.SERVICE_NO_COMPONENTS}
                                </Typography>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
                                    {service.components.map((component) => (
                                        <ComponentCard
                                            key={component.id}
                                            component={component}
                                            isMaster={isMaster}
                                            labels={labels}
                                            canMoveComponents={canMoveComponents}
                                            onMove={(c) => { setTransferComponent(c); setTransferModalOpen(true); }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Action buttons — master only */}
                            {isMaster && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        color="inherit"
                                        disabled={!canEditService || editLoading || startLoading}
                                        onClick={() => setEditingOpen(true)}
                                    >
                                        {labels.SERVICE_EDIT_BUTTON}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        disabled={!canServiceAction || startLoading || editLoading}
                                        loading={startLoading}
                                        onClick={handleServiceAction}
                                    >
                                        {serviceActionLabel}
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            )}

            <StockTransferModal
                open={transferModalOpen}
                onClose={() => setTransferModalOpen(false)}
                onTransferDone={onServiceRefresh}
                mode="master"
                initialComponent={transferComponent}
            />

            {/* Snackbar for success notification */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant={snackbar.severity === 'error' ? 'filled' : 'standard'}
                    sx={{ width: '100%', minWidth: { xs: 280, sm: 420 } }}
                >
                    {snackbarTitle ? <AlertTitle>{snackbarTitle}</AlertTitle> : null}
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default RepairServiceItem;
