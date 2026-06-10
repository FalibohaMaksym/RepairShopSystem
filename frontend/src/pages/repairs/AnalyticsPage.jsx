import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    Tab,
    Tabs,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useTheme,
} from '@mui/material';
import { useLanguage } from '../../app/i18n/LanguageContext';
import { triggerEtlLoad, fetchAnalyticsFreshness, fetchAvailableYears } from '../../services/analyticsService';
import RepairAnalyticsSection from './components/RepairAnalyticsSection';
import SupplyAnalyticsSection from './components/SupplyAnalyticsSection';

// ─── Year range helpers ───────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

// ─── Date formatter ───────────────────────────────────────────────────────────

const formatFreshnessDate = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AnalyticsPage = () => {
    const { labels } = useLanguage();
    const l = labels.analytics;

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [startYear, setStartYear] = useState(CURRENT_YEAR - 1);
    const [endYear, setEndYear] = useState(CURRENT_YEAR);
    const [yearOptions, setYearOptions] = useState([CURRENT_YEAR - 1, CURRENT_YEAR]);
    const [granularity, setGranularity] = useState('MONTH');
    const [activeTab, setActiveTab] = useState(0);

    // ── Freshness ─────────────────────────────────────────────────────────────
    const [freshnessDate, setFreshnessDate] = useState(null);

    const loadAnalyticsMetadata = () => {
        fetchAnalyticsFreshness()
            .then((data) => setFreshnessDate(formatFreshnessDate(data?.lastLoadDatetime)))
            .catch(() => {});

        fetchAvailableYears()
            .then((data) => {
                const min = data?.minYear || CURRENT_YEAR - 1;
                const max = data?.maxYear || CURRENT_YEAR;
                const safeMin = Math.min(min, max);
                const safeMax = Math.max(min, max);
                
                const options = Array.from({ length: safeMax - safeMin + 1 }, (_, i) => safeMin + i);
                setYearOptions(options);
                
                setStartYear((prev) => (prev < safeMin ? safeMin : (prev > safeMax ? safeMax : prev)));
                setEndYear((prev) => (prev > safeMax ? safeMax : (prev < safeMin ? safeMin : prev)));
            })
            .catch(() => {});
    };

    useEffect(() => {
        loadAnalyticsMetadata();
    }, []);

    // ── ETL state ─────────────────────────────────────────────────────────────
    const [etlDialogOpen, setEtlDialogOpen] = useState(false);
    const [etlLoading, setEtlLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleEtlConfirm = async () => {
        setEtlDialogOpen(false);
        setEtlLoading(true);
        try {
            const result = await triggerEtlLoad();
            setSnackbar({
                open: true,
                message: result?.message || l.ETL_SUCCESS,
                severity: result?.success === false ? 'error' : 'success',
            });
            if (result?.success !== false) {
                loadAnalyticsMetadata();
            }
        } catch (e) {
            console.error('ETL Error:', e);
            let errMsg = l.ETL_ERROR_GENERAL;
            
            if (e.response?.data?.message) {
                errMsg = e.response.data.message;
            } else if (e.response?.status === 403) {
                errMsg = l.ETL_ERROR_FORBIDDEN;
            } else if (e.message) {
                errMsg += ` ${l.ETL_ERROR_DETAILS}${e.message}`;
            }

            setSnackbar({
                open: true,
                message: errMsg,
                severity: 'error',
            });
        } finally {
            setEtlLoading(false);
        }
    };

    return (
        <Box sx={{ width: '100%', minWidth: 0 }}>
            {/* ── Title row ─────────────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, gap: 2 }}>
                <Box>
                    <Typography component="h1" variant="h4" fontWeight={600} sx={{ color: 'text.primary' }}>
                        {l.TITLE}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {freshnessDate
                            ? `${l.FRESHNESS_PREFIX}${freshnessDate}`
                            : l.FRESHNESS_EMPTY}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    disabled={etlLoading}
                    onClick={() => setEtlDialogOpen(true)}
                    startIcon={etlLoading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{ whiteSpace: 'nowrap', flexShrink: 0, mt: 0.5 }}
                >
                    {etlLoading ? l.EXECUTING : l.TRIGGER_ETL_BTN}
                </Button>
            </Box>

            {/* ETL confirmation dialog */}
            <Dialog open={etlDialogOpen} onClose={() => setEtlDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ color: 'text.primary', pb: 1 }}>
                    {l.ETL_CONFIRM_TITLE}
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning">
                        {l.ETL_CONFIRM_TEXT}
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setEtlDialogOpen(false)} variant="outlined" color="inherit">
                        {l.CANCEL}
                    </Button>
                    <Button onClick={handleEtlConfirm} variant="contained" autoFocus>
                        {l.RUN}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled"
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* ── Global controls ───────────────────────────────────────────── */}
            <Card sx={{ bgcolor: 'background.paper', boxShadow: 2, borderRadius: 2, mb: 2.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography fontWeight={600} sx={{ fontSize: '0.88rem', color: 'text.secondary' }}>
                            {l.YEARS}
                        </Typography>

                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>{l.FROM}</InputLabel>
                            <Select
                                label={l.FROM}
                                value={yearOptions.includes(startYear) ? startYear : ''}
                                onChange={(e) => setStartYear(e.target.value)}
                            >
                                {yearOptions.filter((y) => y <= endYear).map((y) => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>{l.TO}</InputLabel>
                            <Select
                                label={l.TO}
                                value={yearOptions.includes(endYear) ? endYear : ''}
                                onChange={(e) => setEndYear(e.target.value)}
                            >
                                {yearOptions.filter((y) => y >= startYear).map((y) => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                        <Typography fontWeight={600} sx={{ fontSize: '0.88rem', color: 'text.secondary' }}>
                            {l.GRANULARITY}
                        </Typography>

                        <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={granularity}
                            onChange={(_, v) => { if (v) setGranularity(v); }}
                        >
                            <ToggleButton value="MONTH" sx={{ fontSize: '0.78rem', px: 1.5 }}>{l.MONTH}</ToggleButton>
                            <ToggleButton value="QUARTER" sx={{ fontSize: '0.78rem', px: 1.5 }}>{l.QUARTER}</ToggleButton>
                            <ToggleButton value="YEAR" sx={{ fontSize: '0.78rem', px: 1.5 }}>{l.YEAR}</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </CardContent>
            </Card>

            {/* ── Section tabs ──────────────────────────────────────────────── */}
            <Box sx={{
                borderBottom: 1,
                borderColor: 'divider',
                mb: 2.5,
                bgcolor: 'background.paper',
                borderRadius: '8px 8px 0 0',
                boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
            }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 1 }}>
                    <Tab label={l.TAB_REPAIRS} sx={{ fontSize: '0.88rem', fontWeight: 500 }} />
                    <Tab label={l.TAB_SUPPLIES}  sx={{ fontSize: '0.88rem', fontWeight: 500 }} />
                </Tabs>
            </Box>

            {/* ── Tab content ───────────────────────────────────────────────── */}
            {activeTab === 0 && (
                <RepairAnalyticsSection
                    startYear={startYear}
                    endYear={endYear}
                    granularity={granularity}
                    yearOptions={yearOptions}
                    refreshTrigger={freshnessDate}
                />
            )}
            {activeTab === 1 && (
                <SupplyAnalyticsSection
                    startYear={startYear}
                    endYear={endYear}
                    granularity={granularity}
                    refreshTrigger={freshnessDate}
                />
            )}
        </Box>
    );
};

export default AnalyticsPage;
