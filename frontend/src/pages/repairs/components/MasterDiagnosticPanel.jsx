import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Snackbar,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    createDeviceDefect,
    deleteDeviceDefect,
    fetchDeviceDefects,
    updateDeviceDefect,
} from '../../../services/deviceDefectsService';

const panelSx = {
    p: 2,
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(190, 130, 210, 0.15)' : '#E2D2E6',
    border: '1px solid',
    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(190, 130, 210, 0.4)' : '#cfbed4',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.16)',
};

const textareaSx = {
    '& .MuiInputBase-input': {
        fontSize: '0.95rem',
        lineHeight: 1.35,
    },
    '& .MuiInputLabel-root': {
        fontSize: '0.9rem',
    },
};

const defectRowSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    mt: 1,
};

const defectsListWrapSx = {
    mt: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.8,
};

const defectItemSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    px: 1.2,
    py: 0.8,
    border: '1px solid',
    borderColor: 'rgba(90,90,90,0.45)',
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.58)',
};

const createDefectWrapSx = {
    mt: 1,
    p: 1,
    border: '1px dashed',
    borderColor: 'rgba(90,90,90,0.45)',
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.4)',
};

const manageCreatedDefectWrapSx = {
    mt: 1,
    p: 1,
    border: '1px dashed',
    borderColor: 'rgba(60,90,120,0.45)',
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.48)',
};

/**
 * Panel for the master to fill in diagnostic results and finish the diagnostic.
 *
 * Props:
 *   labels          — i18n labels object (ORDER_DETAILS section)
 *   diagnosticData  — normalized diagnostic object from the service (may be partially filled)
 *   onFinishDiagnostic({ reason, solution, defects }) — called on submit; defects are {id,name}[]
 *   isFinishing     — true while the parent is waiting for the PATCH response
 */
const MasterDiagnosticPanel = ({
    labels,
    diagnosticData,
    onFinishDiagnostic,
    onSaveDiagnosticDraft,
    isDraftSaving = false,
    isFinishing = false,
}) => {
    const [reason, setReason] = useState('');
    const [solution, setSolution] = useState('');

    // Each entry is { id: number, name: string } — id is used for the API, name for display.
    const [defects, setDefects] = useState([]);

    // Currently selected item in the Autocomplete (null when nothing is picked).
    const [defectToAdd, setDefectToAdd] = useState(null);

    const [defectOptions, setDefectOptions] = useState([]);
    const [defectOptionsLoading, setDefectOptionsLoading] = useState(false);
    const [createDefectOpen, setCreateDefectOpen] = useState(false);
    const [newDefectName, setNewDefectName] = useState('');
    const [createDefectLoading, setCreateDefectLoading] = useState(false);
    const [createdDefect, setCreatedDefect] = useState(null);
    const [editCreatedDefectName, setEditCreatedDefectName] = useState('');
    const [manageDefectLoading, setManageDefectLoading] = useState(false);
    const [defectMenuAnchorEl, setDefectMenuAnchorEl] = useState(null);
    const [defectMenuIndex, setDefectMenuIndex] = useState(null);
    const [snackbarState, setSnackbarState] = useState({
        open: false,
        message: '',
        severity: 'success',
    });
    const [draftSaveState, setDraftSaveState] = useState('idle');
    const lastSavedDraftKeyRef = useRef('');
    const latestDraftRequestRef = useRef(0);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbarState({ open: true, message, severity });
    };

    const closeSnackbar = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarState((prev) => ({ ...prev, open: false }));
    };

    const loadDefectOptions = async () => {
        setDefectOptionsLoading(true);
        try {
            const options = await fetchDeviceDefects();
            setDefectOptions(options);
        } catch {
            setDefectOptions([]);
        } finally {
            setDefectOptionsLoading(false);
        }
    };

    // ── Load defect catalog on mount ──
    useEffect(() => {
        loadDefectOptions();
    }, []);

    // ── Sync form with incoming diagnosticData ──
    useEffect(() => {
        const incomingDefects = Array.isArray(diagnosticData?.defects) && diagnosticData.defects.length > 0
            ? diagnosticData.defects
            : [];

        const incomingDraftKey = JSON.stringify({
            defectReason: diagnosticData?.defectReason || '',
            defectSolution: diagnosticData?.defectSolution || '',
            defectIds: incomingDefects.map((item) => item.id),
        });

        lastSavedDraftKeyRef.current = incomingDraftKey;
        setReason(diagnosticData?.defectReason || '');
        setSolution(diagnosticData?.defectSolution || '');
        setDefects(incomingDefects);
        setDefectToAdd(null);
        setDraftSaveState('idle');
    }, [diagnosticData]);

    useEffect(() => {
        if (!onSaveDiagnosticDraft || isFinishing || diagnosticData?.diagnosticFinishedAt) return;

        const currentDraftPayload = {
            reason,
            solution,
            defects,
        };

        const currentDraftKey = JSON.stringify({
            defectReason: reason || '',
            defectSolution: solution || '',
            defectIds: defects.map((item) => item.id),
        });

        if (currentDraftKey === lastSavedDraftKeyRef.current) return;

        const requestId = latestDraftRequestRef.current + 1;
        latestDraftRequestRef.current = requestId;

        setDraftSaveState('saving');

        const timer = setTimeout(async () => {
            try {
                await onSaveDiagnosticDraft(currentDraftPayload);

                // Ignore outdated save results when a newer request exists.
                if (latestDraftRequestRef.current !== requestId) return;

                lastSavedDraftKeyRef.current = currentDraftKey;
                setDraftSaveState('saved');
            } catch (error) {
                if (latestDraftRequestRef.current !== requestId) return;

                setDraftSaveState('error');
                const apiMessage = error?.response?.data?.error;
                showSnackbar(apiMessage || labels.DIAGNOSTIC_DRAFT_SAVE_FAILED, 'error');
            }
        }, 700);

        return () => clearTimeout(timer);
    }, [
        reason,
        solution,
        defects,
        onSaveDiagnosticDraft,
        isFinishing,
        diagnosticData?.diagnosticFinishedAt,
        labels.DIAGNOSTIC_DRAFT_SAVE_FAILED,
    ]);

    const startedAt  = diagnosticData?.diagnosticStartedAt  || labels.UNKNOWN_VALUE;
    const finishedAt = diagnosticData?.diagnosticFinishedAt || labels.DIAGNOSTIC_IN_PROGRESS;
    const workerName = diagnosticData?.workerFullName        || labels.UNKNOWN_VALUE;

    const addDefect = () => {
        if (!defectToAdd) return;
        // Skip duplicates by id
        if (defects.some((d) => d.id === defectToAdd.id)) return;
        setDefects((prev) => [...prev, defectToAdd]);
        setDefectToAdd(null);
    };

    const isEndpointUnavailable = (error) => {
        const status = error?.response?.status;
        return status === 404 || status === 405 || status === 501;
    };

    const handleCreateDefect = async () => {
        const normalized = newDefectName.trim();
        if (!normalized || createDefectLoading) return;

        if (normalized.length > 70) {
            showSnackbar(labels.DIAGNOSTIC_CREATE_DEFECT_TOO_LONG, 'error');
            return;
        }

        const exists = defectOptions.some(
            (option) => option.name.toLowerCase() === normalized.toLowerCase()
        );

        if (exists) {
            showSnackbar(labels.DIAGNOSTIC_CREATE_DEFECT_DUPLICATE, 'error');
            return;
        }

        setCreateDefectLoading(true);

        try {
            const created = await createDeviceDefect(normalized);
            await loadDefectOptions();

            setDefectToAdd(created);
            setDefects((prev) => {
                if (prev.some((d) => d.id === created.id)) return prev;
                return [...prev, created];
            });
            setCreatedDefect(created);
            setEditCreatedDefectName(created.name);

            showSnackbar(labels.DIAGNOSTIC_CREATE_DEFECT_SUCCESS, 'success');
            setNewDefectName('');
            setCreateDefectOpen(false);
        } catch (error) {
            if (error?.response?.status === 403) {
                showSnackbar(labels.DIAGNOSTIC_CREATE_DEFECT_FORBIDDEN, 'error');
                return;
            }

            const apiMessage = error?.response?.data?.error;
            showSnackbar(apiMessage || labels.DIAGNOSTIC_CREATE_DEFECT_FAILED, 'error');
        } finally {
            setCreateDefectLoading(false);
        }
    };

    const handleUpdateCreatedDefect = async () => {
        if (!createdDefect || manageDefectLoading) return;

        const normalized = editCreatedDefectName.trim();
        if (!normalized) {
            showSnackbar(labels.DIAGNOSTIC_EDIT_DEFECT_EMPTY, 'error');
            return;
        }

        if (normalized.length > 70) {
            showSnackbar(labels.DIAGNOSTIC_CREATE_DEFECT_TOO_LONG, 'error');
            return;
        }

        const exists = defectOptions.some(
            (option) => option.id !== createdDefect.id && option.name.toLowerCase() === normalized.toLowerCase()
        );
        if (exists) {
            showSnackbar(labels.DIAGNOSTIC_CREATE_DEFECT_DUPLICATE, 'error');
            return;
        }

        setManageDefectLoading(true);

        try {
            const updated = await updateDeviceDefect(createdDefect.id, normalized);
            await loadDefectOptions();

            setCreatedDefect(updated);
            setEditCreatedDefectName(updated.name);
            setDefects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setDefectToAdd((prev) => (prev?.id === updated.id ? updated : prev));
            handleCancelEditDefect();
            showSnackbar(labels.DIAGNOSTIC_EDIT_DEFECT_SUCCESS, 'success');
        } catch (error) {
            if (error?.response?.status === 403) {
                showSnackbar(labels.DIAGNOSTIC_EDIT_DEFECT_FORBIDDEN, 'error');
                return;
            }

            if (isEndpointUnavailable(error)) {
                showSnackbar(labels.DIAGNOSTIC_MANAGE_DEFECT_ENDPOINT_MISSING, 'error');
                return;
            }

            const apiMessage = error?.response?.data?.error;
            showSnackbar(apiMessage || labels.DIAGNOSTIC_EDIT_DEFECT_FAILED, 'error');
        } finally {
            setManageDefectLoading(false);
        }
    };

    const removeDefect = (index) => {
        setDefects((prev) => prev.filter((_, idx) => idx !== index));
    };

    const openDefectActionsMenu = (event, index) => {
        setDefectMenuAnchorEl(event.currentTarget);
        setDefectMenuIndex(index);
    };

    const closeDefectActionsMenu = () => {
        setDefectMenuAnchorEl(null);
        setDefectMenuIndex(null);
    };

    const handleRemoveFromList = () => {
        if (defectMenuIndex == null) return;
        removeDefect(defectMenuIndex);
        closeDefectActionsMenu();
    };

    const handleEditFromList = () => {
        if (defectMenuIndex == null) return;
        const defect = defects[defectMenuIndex];
        if (!defect) return;

        setCreatedDefect(defect);
        setEditCreatedDefectName(defect.name);
        closeDefectActionsMenu();
    };

    const handleDeleteFromSystem = async () => {
        if (defectMenuIndex == null || manageDefectLoading) return;
        const defect = defects[defectMenuIndex];
        if (!defect?.id) return;

        setManageDefectLoading(true);

        try {
            await deleteDeviceDefect(defect.id);
            await loadDefectOptions();

            setDefects((prev) => prev.filter((item) => item.id !== defect.id));
            setDefectToAdd((prev) => (prev?.id === defect.id ? null : prev));
            setCreatedDefect((prev) => (prev?.id === defect.id ? null : prev));
            setEditCreatedDefectName((prev) => (createdDefect?.id === defect.id ? '' : prev));
            showSnackbar(labels.DIAGNOSTIC_DELETE_DEFECT_SUCCESS, 'success');
        } catch (error) {
            if (error?.response?.status === 403) {
                showSnackbar(labels.DIAGNOSTIC_DELETE_DEFECT_FORBIDDEN, 'error');
            } else if (isEndpointUnavailable(error)) {
                showSnackbar(labels.DIAGNOSTIC_MANAGE_DEFECT_ENDPOINT_MISSING, 'error');
            } else {
                const apiMessage = error?.response?.data?.error;
                showSnackbar(apiMessage || labels.DIAGNOSTIC_DELETE_DEFECT_FAILED, 'error');
            }
        } finally {
            setManageDefectLoading(false);
            closeDefectActionsMenu();
        }
    };

    const handleCancelEditDefect = () => {
        setCreatedDefect(null);
        setEditCreatedDefectName('');
    };

    const handleSubmit = () => {
        onFinishDiagnostic({ reason, solution, defects });
    };

    return (
        <Paper sx={panelSx}>
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 500,
                    mb: 1.2,
                    display: 'inline-flex',
                    px: 0.8,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                {labels.DIAGNOSTICS_SECTION_TITLE}
            </Typography>

            <Typography sx={{ mb: 0.6 }}>
                <b>{labels.DIAGNOSTIC_ACTIVE_WORKER}:</b> {workerName}
            </Typography>
            <Typography sx={{ mb: 0.5 }}>
                <b>{labels.DIAGNOSTIC_STARTED_AT}:</b> {startedAt}
            </Typography>
            <Typography sx={{ mb: 1.2 }}>
                <b>{labels.DIAGNOSTIC_FINISHED_AT}:</b> {finishedAt}
            </Typography>

            {/* Defect reason */}
            <TextField
                multiline
                minRows={2}
                fullWidth
                label={labels.DIAGNOSTIC_REASON}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isFinishing}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ ...textareaSx, mt: 2 }}
            />

            <Divider sx={{ my: 1.6 }} />

            {/* Defects list */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography sx={{ fontWeight: 600 }}>{labels.DIAGNOSTIC_DEFECTS}</Typography>
            </Box>

            <Box sx={defectRowSx}>
                <Autocomplete
                    fullWidth
                    options={defectOptions}
                    value={defectToAdd}
                    onChange={(_, value) => setDefectToAdd(value)}
                    getOptionLabel={(option) => option?.name ?? ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    loading={defectOptionsLoading}
                    disabled={isFinishing}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            placeholder={labels.DIAGNOSTIC_DEFECT_PLACEHOLDER}
                        />
                    )}
                />
                <IconButton
                    size="small"
                    onClick={addDefect}
                    disabled={!defectToAdd || isFinishing}
                >
                    <AddIcon />
                </IconButton>
            </Box>

            <Box sx={{ mt: 0.7, display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                        setCreateDefectOpen((prev) => !prev);
                    }}
                    disabled={isFinishing || createDefectLoading || manageDefectLoading}
                    sx={{ textTransform: 'none', px: 0 }}
                >
                    {labels.DIAGNOSTIC_CREATE_DEFECT_TOGGLE}
                </Button>
            </Box>

            {createDefectOpen && (
                <Box sx={createDefectWrapSx}>
                    <Typography sx={{ mb: 0.8, fontWeight: 600, fontSize: '0.9rem' }}>
                        {labels.DIAGNOSTIC_CREATE_DEFECT_TITLE}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                        <TextField
                            fullWidth
                            size="small"
                            value={newDefectName}
                            onChange={(e) => setNewDefectName(e.target.value)}
                            placeholder={labels.DIAGNOSTIC_CREATE_DEFECT_PLACEHOLDER}
                            slotProps={{ htmlInput: { maxLength: 70 } }}
                            disabled={isFinishing || createDefectLoading}
                        />
                        <Button
                            variant="contained"
                            onClick={handleCreateDefect}
                            disabled={!newDefectName.trim() || isFinishing || createDefectLoading || manageDefectLoading}
                            sx={{ minWidth: 120 }}
                        >
                            {createDefectLoading ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                labels.DIAGNOSTIC_CREATE_DEFECT_BUTTON
                            )}
                        </Button>
                    </Box>
                </Box>
            )}

            {createdDefect && (
                <Box sx={manageCreatedDefectWrapSx}>
                    <Typography sx={{ mb: 0.8, fontWeight: 600, fontSize: '0.9rem' }}>
                        {labels.DIAGNOSTIC_EDIT_DEFECT_TITLE}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            fullWidth
                            size="small"
                            value={editCreatedDefectName}
                            onChange={(e) => setEditCreatedDefectName(e.target.value)}
                            placeholder={labels.DIAGNOSTIC_EDIT_DEFECT_PLACEHOLDER}
                            slotProps={{ htmlInput: { maxLength: 70 } }}
                            disabled={isFinishing || manageDefectLoading}
                        />
                        <Button
                            variant="outlined"
                            onClick={handleUpdateCreatedDefect}
                            disabled={!editCreatedDefectName.trim() || isFinishing || manageDefectLoading}
                        >
                            {labels.DIAGNOSTIC_EDIT_DEFECT_BUTTON}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleCancelEditDefect}
                            disabled={isFinishing || manageDefectLoading}
                        >
                            {labels.DIAGNOSTIC_EDIT_DEFECT_CANCEL_BUTTON}
                        </Button>
                        {manageDefectLoading && <CircularProgress size={16} />}
                    </Box>
                </Box>
            )}

            <Snackbar
                open={snackbarState.open}
                autoHideDuration={3500}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={closeSnackbar} severity={snackbarState.severity} sx={{ width: '100%' }}>
                    {snackbarState.message}
                </Alert>
            </Snackbar>

            {defects.length === 0 ? (
                <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.88rem' }}>
                    {labels.DIAGNOSTIC_DEFECTS_EMPTY}
                </Typography>
            ) : (
                <Box sx={defectsListWrapSx}>
                    {defects.map((defect, idx) => (
                        <Box key={defect.id} sx={defectItemSx}>
                            <Typography>{defect.name}</Typography>
                            <IconButton
                                size="small"
                                onClick={(event) => openDefectActionsMenu(event, idx)}
                                disabled={isFinishing}
                            >
                                <MoreVertIcon />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            <Menu
                anchorEl={defectMenuAnchorEl}
                open={Boolean(defectMenuAnchorEl)}
                onClose={closeDefectActionsMenu}
            >
                <MenuItem onClick={handleEditFromList} disabled={isFinishing || manageDefectLoading}>
                    {labels.DIAGNOSTIC_DEFECT_ACTION_EDIT}
                </MenuItem>
                <MenuItem onClick={handleDeleteFromSystem} disabled={isFinishing || manageDefectLoading}>
                    {labels.DIAGNOSTIC_DEFECT_ACTION_DELETE_SYSTEM}
                </MenuItem>
                <MenuItem onClick={handleRemoveFromList} disabled={isFinishing || manageDefectLoading}>
                    {labels.DIAGNOSTIC_DEFECT_ACTION_REMOVE_LIST}
                </MenuItem>
            </Menu>

            <Divider sx={{ my: 1.8 }} />

            {!diagnosticData?.diagnosticFinishedAt && (
                <Typography color="text.secondary" sx={{ fontSize: '0.85rem', mb: 0.8 }}>
                    {isDraftSaving || draftSaveState === 'saving'
                        ? labels.DIAGNOSTIC_DRAFT_SAVING
                        : draftSaveState === 'saved'
                            ? labels.DIAGNOSTIC_DRAFT_SAVED
                            : labels.DIAGNOSTIC_DRAFT_IDLE}
                </Typography>
            )}

            {/* Defect solution */}
            <TextField
                multiline
                minRows={2}
                fullWidth
                label={labels.DIAGNOSTIC_SOLUTION}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                disabled={isFinishing}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ ...textareaSx, mt: 2 }}
            />

            <Box sx={{ mt: 1.8, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isFinishing}
                    sx={{
                        bgcolor: '#B874CE',
                        '&:hover': { bgcolor: '#A45DBB' },
                    }}
                >
                    {isFinishing
                        ? labels.FINISH_DIAGNOSTIC_LOADING_BUTTON
                        : labels.FINISH_DIAGNOSTIC_BUTTON}
                </Button>
            </Box>
        </Paper>
    );
};

export default MasterDiagnosticPanel;
