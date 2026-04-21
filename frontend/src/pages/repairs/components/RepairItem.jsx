import React, { useState } from 'react';
import {
    Box,
    Button,
    Divider,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RepairServiceItem from './RepairServiceItem';
import ServicePlanningForm from './ServicePlanningForm';
import { planRepairService } from '../../../services/ordersService';

// ─── Status / priority config ─────────────────────────────────────────────────

const STATUS_CONFIG = {
    FINISHED: {
        dot: '#2E7D32',
        bg: 'rgba(76,175,80,0.12)',
        border: 'rgba(76,175,80,0.4)',
        labelKey: 'REPAIR_STATUS_FINISHED',
    },
    IN_PROGRESS: {
        dot: '#E65100',
        bg: 'rgba(255,152,0,0.12)',
        border: 'rgba(255,152,0,0.4)',
        labelKey: 'REPAIR_STATUS_IN_PROGRESS',
    },
    COMPONENTS_ORDERED: {
        dot: '#1565C0',
        bg: 'rgba(33,150,243,0.10)',
        border: 'rgba(33,150,243,0.4)',
        labelKey: 'REPAIR_STATUS_COMPONENTS_ORDERED',
    },
    PENDING: {
        dot: '#616161',
        bg: 'rgba(158,158,158,0.12)',
        border: 'rgba(158,158,158,0.4)',
        labelKey: 'REPAIR_STATUS_PENDING',
    },
};

const PRIORITY_CONFIG = {
    HIGH: {
        bg: '#FADADD',
        border: '#F0BABA',
        labelKey: 'REPAIR_PLAN_PRIORITY_HIGH',
    },
    MEDIUM: {
        bg: '#DAE8F5',
        border: '#B8D4E8',
        labelKey: 'REPAIR_PLAN_PRIORITY_MEDIUM',
    },
    LOW: {
        bg: '#DAF0DC',
        border: '#B8E2BB',
        labelKey: 'REPAIR_PLAN_PRIORITY_LOW',
    },
};

// ─── Chips ────────────────────────────────────────────────────────────────────

const StatusChip = ({ config, label }) => (
    <Box
        sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.7,
            px: 1.3,
            py: 0.35,
            borderRadius: 4,
            bgcolor: config.bg,
            border: `1px solid ${config.border}`,
            flexShrink: 0,
        }}
    >
        <Box
            sx={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                bgcolor: config.dot,
                flexShrink: 0,
            }}
        />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {label}
        </Typography>
    </Box>
);

const PriorityChip = ({ label }) => (
    <Box
        sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.3,
            py: 0.35,
            borderRadius: 4,
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            flexShrink: 0,
        }}
    >
        <Typography sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
            {label}
        </Typography>
    </Box>
);

// ─── RepairItem ───────────────────────────────────────────────────────────────

/**
 * Single repair row with collapsible details.
 * Collapsed: shows name, status badge, priority badge, arrow.
 * Expanded:  shows dates, services list (or planning form), action buttons.
 *
 * Props:
 *   repair         — repair data object from mock / API
 *   isMaster       — boolean — master can edit; admin is read-only
 *   labels         — ORDER_DETAILS i18n section
 *   onFinishRepair — (repairId) callback called when "Завершити ремонт" is clicked
 */
const RepairItem = ({ repair, isMaster, labels, deviceTypeName, orderNumber, onFinishRepair, onPauseRepair, onServicePlanned, expanded, onToggleExpanded }) => {
    const [planningOpen, setPlanningOpen] = useState(false);

    const statusCfg = STATUS_CONFIG[repair.statusKey] ?? STATUS_CONFIG.PENDING;
    const priorityCfg = PRIORITY_CONFIG[repair.priorityKey] ?? PRIORITY_CONFIG.MEDIUM;

    const statusLabel = repair.statusLabel || repair.statusKey;
    const priorityLabel = `${labels.REPAIR_PRIORITY_LABEL}: ${repair.priorityLabel || repair.priorityKey}`;

    const handleServiceSubmit = async ({ workerServiceId, requiredComponents }) => {
        if (!orderNumber || !repair?.id || !workerServiceId) {
            return;
        }

        await planRepairService(orderNumber, repair.id, {
            workerServiceId,
            components: (requiredComponents ?? []).map((item) => ({
                componentId: item.id,
                quantity: item.quantity,
            })),
        });

        setPlanningOpen(false);
        onServicePlanned?.();
    };

    return (
        <Box
            sx={{
                border: '1px solid rgba(60,90,120,0.22)',
                borderRadius: 1.5,
                mb: 1.2,
                overflow: 'hidden',
                bgcolor: 'background.paper',
            }}
        >
            {/* ── Header row (always visible) ── */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.025)' },
                }}
                onClick={onToggleExpanded}
            >
                <Typography fontWeight={700} sx={{ mr: 0.5 }}>
                    {labels.REPAIR_ITEM_NAME}
                </Typography>
                <StatusChip config={statusCfg} label={statusLabel} />
                <PriorityChip label={priorityLabel} />
                <IconButton size="small" sx={{ ml: 'auto', p: 0.5 }}>
                    {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                </IconButton>
            </Box>

            {/* ── Expanded content ── */}
            {expanded && (
                <Box sx={{ px: 1.5, pb: 1.5, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                    {/* Dates */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 2,
                            py: 0.9,
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {labels.REPAIR_STARTED_AT_LABEL}: {repair.startedAt || labels.REPAIR_NOT_STARTED}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {labels.REPAIR_FINISHED_AT_LABEL}: {repair.finishedAt || labels.REPAIR_NOT_FINISHED}
                        </Typography>
                    </Box>

                    {/* Services section or planning form */}
                    {planningOpen ? (
                        <ServicePlanningForm
                            labels={labels}
                            deviceTypeName={deviceTypeName}
                            orderNumber={orderNumber}
                            onCancel={() => setPlanningOpen(false)}
                            onSubmit={handleServiceSubmit}
                        />
                    ) : (
                        <>
                            {/* Section header with divider + "Plan service" button */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.2,
                                    mb: 1,
                                }}
                            >
                                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                    <Divider>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            color="text.secondary"
                                        >
                                            {labels.REPAIR_SERVICES_SECTION}
                                        </Typography>
                                    </Divider>
                                </Box>
                                {isMaster && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPlanningOpen(true);
                                        }}
                                    >
                                        {labels.REPAIR_PLAN_SERVICE_BUTTON}
                                    </Button>
                                )}
                            </Box>

                            {/* Services list */}
                            {repair.services.length === 0 ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 1.2 }}
                                >
                                    {labels.REPAIR_NO_SERVICES}
                                </Typography>
                            ) : (
                                repair.services.map((service) => (
                                    <RepairServiceItem
                                        key={service.id}
                                        service={service}
                                        isMaster={isMaster}
                                        labels={labels}
                                        orderNumber={orderNumber}
                                        repairId={repair.id}
                                        onServiceRefresh={onServicePlanned}
                                    />
                                ))
                            )}

                            {/* Action buttons — master only, non-finished */}
                            {isMaster && repair.statusKey !== 'FINISHED' && (() => {
                                // Services that are running (started but not yet finished) — block both pause and finish
                                const hasRunningServices = repair.services.some(
                                    (s) => s.startedAt && !s.finishedAt
                                );
                                // Show pause whenever repair has been started but not finished
                                const canPause = Boolean(repair.startedAt);
                                return (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.2 }}>
                                        {/* Pause — blocked only by running (started+unfinished) services */}
                                        {canPause && (
                                            <Tooltip
                                                title={hasRunningServices
                                                    ? (labels.REPAIR_PAUSE_BLOCKED_RUNNING_SERVICES ?? 'Завершіть активні послуги перед призупиненням ремонту')
                                                    : ''}
                                                disableHoverListener={!hasRunningServices}
                                                arrow
                                            >
                                                <span>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        color="warning"
                                                        disabled={hasRunningServices}
                                                        onClick={() => onPauseRepair?.(repair.id)}
                                                    >
                                                        {labels.REPAIR_PAUSE_BUTTON}
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        )}

                                        {/* Finish — also blocked by running services */}
                                        <Tooltip
                                            title={hasRunningServices
                                                ? (labels.REPAIR_FINISH_BLOCKED_UNFINISHED_SERVICES ?? 'Завершіть активні послуги перед закриттям ремонту')
                                                : ''}
                                            disableHoverListener={!hasRunningServices}
                                            arrow
                                        >
                                            <span>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    disabled={hasRunningServices}
                                                    onClick={() => onFinishRepair?.(repair.id)}
                                                >
                                                    {labels.REPAIR_FINISH_REPAIR_BUTTON}
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                );
                            })()}
                        </>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default RepairItem;
