import React, { useState, useEffect, memo } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Collapse,
    Checkbox,
    FormControlLabel,
    Slider,
    Button,
    useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
    filterCardPaperSx,
    filterCardHeaderSx,
    filterCardTitleSx,
    filterCardToggleSx,
    filterCardBodySx,
    filterCardExpandIconSx,
    filterInputSx,
    filterPanelPaperSx,
    checkboxLabelSx,
    checkboxRowSx,
    rangeInputsRowSx,
    clearFiltersRowSx,
    clearFiltersButtonSx,
} from '../../repairs/ActiveRepairOrdersPage.styles';

/**
 * Reusable filter card with optional collapse.
 */
const FilterCard = ({ title, children, collapsible = false }) => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);

    return (
        <Paper elevation={0} sx={filterCardPaperSx(theme)}>
            <Box
                sx={filterCardHeaderSx(collapsible)}
                onClick={collapsible ? () => setOpen((p) => !p) : undefined}
            >
                <Typography variant="body2" fontWeight={500} align="center" sx={filterCardTitleSx}>
                    {title}
                </Typography>
                {collapsible && (
                    <Box sx={filterCardToggleSx}>
                        {open
                            ? <ExpandLessIcon sx={filterCardExpandIconSx} />
                            : <ExpandMoreIcon sx={filterCardExpandIconSx} />}
                    </Box>
                )}
            </Box>

            {collapsible ? (
                <Collapse in={open}>
                    <Box sx={filterCardBodySx}>{children}</Box>
                </Collapse>
            ) : (
                <Box sx={filterCardBodySx}>{children}</Box>
            )}
        </Paper>
    );
};

const toggleSetItem = (setter, value) => {
    setter((prev) => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
    });
};

/**
 * Inline Collapse filter panel for Active Supplies page.
 * Layout: 4 columns matching the design mockup.
 */
const ActiveSuppliesFilters = ({
    filterOpen,
    L,
    // Order date
    orderDateFrom, orderDateTo, setOrderDateFrom, setOrderDateTo,
    orderDateRange, orderDateSliderFrom, orderDateSliderTo,
    // Expected date
    expectedDateFrom, expectedDateTo, setExpectedDateFrom, setExpectedDateTo,
    expectedDateRange, expectedDateSliderFrom, expectedDateSliderTo,
    // Amount
    amountMin, amountMax, setAmountMin, setAmountMax, amountRange,
    sliderMin, sliderMax,
    // Category
    availableCategories, selectedCategories, setSelectedCategories,
    // Supplier
    availableSuppliers, selectedSuppliers, setSelectedSuppliers,
    // Worker
    availableWorkers, selectedWorkers, setSelectedWorkers,
    // Delays
    selectedDelays, setSelectedDelays,
    // Status
    availableStatuses, selectedStatuses, setSelectedStatuses,
    // Clear
    activeFilterCount, clearFilters,
}) => {
    const theme = useTheme();
    const F = L.FILTER;

    // ── Local slider state (prevents parent re-renders during drag) ──
    const [localOrderDate, setLocalOrderDate] = useState([orderDateSliderFrom, orderDateSliderTo]);
    const [localExpectedDate, setLocalExpectedDate] = useState([expectedDateSliderFrom, expectedDateSliderTo]);
    const [localAmount, setLocalAmount] = useState([
        Math.max(sliderMin, amountRange[0]),
        Math.min(sliderMax, amountRange[1]),
    ]);

    useEffect(() => { setLocalOrderDate([orderDateSliderFrom, orderDateSliderTo]); }, [orderDateSliderFrom, orderDateSliderTo]);
    useEffect(() => { setLocalExpectedDate([expectedDateSliderFrom, expectedDateSliderTo]); }, [expectedDateSliderFrom, expectedDateSliderTo]);
    useEffect(() => {
        setLocalAmount([Math.max(sliderMin, amountRange[0]), Math.min(sliderMax, amountRange[1])]);
    }, [sliderMin, sliderMax, amountRange]);

    return (
        <Collapse in={filterOpen}>
            <Paper elevation={0} sx={filterPanelPaperSx(theme)}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, 1fr)',
                        lg: '1.1fr 1fr 1fr 1fr',
                    },
                    gap: 2,
                    alignItems: 'flex-start',
                }}>
                    {/* ── Left column: dates + amount ── */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
                        {/* Order date */}
                        <FilterCard title={F.ORDER_DATE}>
                            <Slider
                                value={localOrderDate}
                                min={orderDateRange[0]}
                                max={orderDateRange[1]}
                                onChange={(_, val) => setLocalOrderDate(val)}
                                onChangeCommitted={(_, val) => {
                                    setOrderDateFrom(dayjs(val[0]).startOf('day'));
                                    setOrderDateTo(dayjs(val[1]).endOf('day'));
                                }}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(v) => dayjs(v).format('DD.MM.YY')}
                                size="small"
                                sx={{ mt: 1 }}
                            />
                            <Box sx={rangeInputsRowSx}>
                                <DatePicker
                                    label={F.FROM}
                                    value={orderDateFrom}
                                    onChange={(v) => setOrderDateFrom(v)}
                                    maxDate={orderDateTo ?? undefined}
                                    slotProps={{
                                        textField: { size: 'small', sx: { flex: 1, ...filterInputSx } },
                                    }}
                                />
                                <Typography color="text.secondary">—</Typography>
                                <DatePicker
                                    label={F.TO}
                                    value={orderDateTo}
                                    onChange={(v) => setOrderDateTo(v)}
                                    minDate={orderDateFrom ?? undefined}
                                    slotProps={{
                                        textField: { size: 'small', sx: { flex: 1, ...filterInputSx } },
                                    }}
                                />
                            </Box>
                        </FilterCard>

                        {/* Expected execution date */}
                        <FilterCard title={F.EXPECTED_DATE}>
                            <Slider
                                value={localExpectedDate}
                                min={expectedDateRange[0]}
                                max={expectedDateRange[1]}
                                onChange={(_, val) => setLocalExpectedDate(val)}
                                onChangeCommitted={(_, val) => {
                                    setExpectedDateFrom(dayjs(val[0]).startOf('day'));
                                    setExpectedDateTo(dayjs(val[1]).endOf('day'));
                                }}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(v) => dayjs(v).format('DD.MM.YY')}
                                size="small"
                                sx={{ mt: 1 }}
                            />
                            <Box sx={rangeInputsRowSx}>
                                <DatePicker
                                    label={F.FROM}
                                    value={expectedDateFrom}
                                    onChange={(v) => setExpectedDateFrom(v)}
                                    maxDate={expectedDateTo ?? undefined}
                                    slotProps={{
                                        textField: { size: 'small', sx: { flex: 1, ...filterInputSx } },
                                    }}
                                />
                                <Typography color="text.secondary">—</Typography>
                                <DatePicker
                                    label={F.TO}
                                    value={expectedDateTo}
                                    onChange={(v) => setExpectedDateTo(v)}
                                    minDate={expectedDateFrom ?? undefined}
                                    slotProps={{
                                        textField: { size: 'small', sx: { flex: 1, ...filterInputSx } },
                                    }}
                                />
                            </Box>
                        </FilterCard>
                    </Box>

                    {/* ── Center-left column: category + amount ── */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
                        <FilterCard title={F.CATEGORY} collapsible>
                            {availableCategories.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">—</Typography>
                            ) : availableCategories.map((cat) => (
                                <FormControlLabel
                                    key={cat}
                                    control={
                                        <Checkbox
                                            checked={selectedCategories.has(cat)}
                                            onChange={() => toggleSetItem(setSelectedCategories, cat)}
                                            size="small"
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body2" sx={checkboxLabelSx}>{cat}</Typography>}
                                    sx={checkboxRowSx}
                                />
                            ))}
                        </FilterCard>

                        {/* Amount */}
                        <FilterCard title={F.AMOUNT}>
                            <Slider
                                value={localAmount}
                                min={amountRange[0]}
                                max={amountRange[1]}
                                onChange={(_, val) => setLocalAmount(val)}
                                onChangeCommitted={(_, val) => {
                                    setAmountMin(String(val[0]));
                                    setAmountMax(String(val[1]));
                                }}
                                valueLabelDisplay="auto"
                                size="small"
                                sx={{ mt: 1 }}
                            />
                            <Box sx={rangeInputsRowSx}>
                                <TextField
                                    size="small"
                                    label={F.FROM}
                                    value={amountMin}
                                    onChange={(e) => setAmountMin(e.target.value)}
                                    slotProps={{
                                        htmlInput: { type: 'number', min: amountRange[0] },
                                    }}
                                    sx={{ flex: 1, ...filterInputSx }}
                                />
                                <Typography color="text.secondary">—</Typography>
                                <TextField
                                    size="small"
                                    label={F.TO}
                                    value={amountMax}
                                    onChange={(e) => setAmountMax(e.target.value)}
                                    slotProps={{
                                        htmlInput: { type: 'number', max: amountRange[1] },
                                    }}
                                    sx={{ flex: 1, ...filterInputSx }}
                                />
                            </Box>
                        </FilterCard>
                    </Box>

                    {/* ── Center-right column: supplier + statuses ── */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
                        <FilterCard title={F.SUPPLIER} collapsible>
                            {availableSuppliers.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">—</Typography>
                            ) : availableSuppliers.map((sup) => (
                                <FormControlLabel
                                    key={sup}
                                    control={
                                        <Checkbox
                                            checked={selectedSuppliers.has(sup)}
                                            onChange={() => toggleSetItem(setSelectedSuppliers, sup)}
                                            size="small"
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body2" sx={checkboxLabelSx}>{sup}</Typography>}
                                    sx={checkboxRowSx}
                                />
                            ))}
                        </FilterCard>

                        <FilterCard title={F.STATUS_GROUP}>
                            {availableStatuses.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">—</Typography>
                            ) : availableStatuses.map((status) => (
                                <FormControlLabel
                                    key={status}
                                    control={
                                        <Checkbox
                                            checked={selectedStatuses.has(status)}
                                            onChange={() => toggleSetItem(setSelectedStatuses, status)}
                                            size="small"
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body2" sx={checkboxLabelSx}>{status}</Typography>}
                                    sx={checkboxRowSx}
                                />
                            ))}
                        </FilterCard>
                    </Box>

                    {/* ── Right column: worker, delays ── */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
                        <FilterCard title={F.WORKER} collapsible>
                            {availableWorkers.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">—</Typography>
                            ) : availableWorkers.map((w) => (
                                <FormControlLabel
                                    key={w}
                                    control={
                                        <Checkbox
                                            checked={selectedWorkers.has(w)}
                                            onChange={() => toggleSetItem(setSelectedWorkers, w)}
                                            size="small"
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body2" sx={checkboxLabelSx}>{w}</Typography>}
                                    sx={checkboxRowSx}
                                />
                            ))}
                        </FilterCard>

                        <FilterCard title={F.DELAYS}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedDelays.has('delayed')}
                                        onChange={() => toggleSetItem(setSelectedDelays, 'delayed')}
                                        size="small"
                                        color="primary"
                                    />
                                }
                                label={<Typography variant="body2" sx={checkboxLabelSx}>{F.DELAY_YES}</Typography>}
                                sx={checkboxRowSx}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedDelays.has('not_delayed')}
                                        onChange={() => toggleSetItem(setSelectedDelays, 'not_delayed')}
                                        size="small"
                                        color="primary"
                                    />
                                }
                                label={<Typography variant="body2" sx={checkboxLabelSx}>{F.DELAY_NO}</Typography>}
                                sx={checkboxRowSx}
                            />
                        </FilterCard>
                    </Box>
                </Box>

                {activeFilterCount > 0 && (
                    <Box sx={clearFiltersRowSx}>
                        <Button
                            size="small"
                            color="primary"
                            onClick={clearFilters}
                            sx={clearFiltersButtonSx}
                        >
                            {F.CLEAR} ({activeFilterCount})
                        </Button>
                    </Box>
                )}
            </Paper>
        </Collapse>
    );
};

export default memo(ActiveSuppliesFilters);
