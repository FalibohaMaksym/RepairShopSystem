import React, { useState } from 'react';
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
    filterPanelContentSx,
    leftFilterColumnSx,
    centerFilterColumnSx,
    rightFilterColumnSx,
    checkboxLabelSx,
    checkboxRowSx,
    rangeInputsRowSx,
    clearFiltersRowSx,
    clearFiltersButtonSx,
} from '../ActiveRepairOrdersPage.styles';

const FilterCard = ({ title, children, collapsible = false }) => {
    const theme = useTheme();
    const [open, setOpen] = useState(true);

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

const ActiveOrdersFilters = ({
    filterOpen,
    L,
    availableDeviceTypes,
    selectedDeviceTypes,
    setSelectedDeviceTypes,
    availableProducers,
    selectedProducers,
    setSelectedProducers,
    availableStatuses,
    selectedStatuses,
    setSelectedStatuses,
    sliderMin,
    sliderMax,
    amountRange,
    setAmountMin,
    setAmountMax,
    amountMin,
    amountMax,
    dateSliderFrom,
    dateSliderTo,
    dateRange,
    setDateFrom,
    setDateTo,
    dateFrom,
    dateTo,
    activeFilterCount,
    clearFilters,
}) => {
    const theme = useTheme();

    return (
        <Collapse in={filterOpen}>
            <Paper elevation={0} sx={filterPanelPaperSx(theme)}>
                <Box sx={filterPanelContentSx}>
                    <Box sx={leftFilterColumnSx}>
                        <FilterCard title={L.FILTER.DEVICE_TYPE_GROUP}>
                            {availableDeviceTypes.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">—</Typography>
                            ) : availableDeviceTypes.map((type) => (
                                <FormControlLabel
                                    key={type}
                                    control={
                                        <Checkbox
                                            checked={selectedDeviceTypes.has(type)}
                                            onChange={() => toggleSetItem(setSelectedDeviceTypes, type)}
                                            size="small"
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body2" sx={checkboxLabelSx}>{type}</Typography>}
                                    sx={checkboxRowSx}
                                />
                            ))}
                        </FilterCard>

                        <FilterCard title={L.FILTER.PRODUCER_GROUP} collapsible>
                            {availableProducers.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">—</Typography>
                            ) : availableProducers.map((producer) => (
                                <FormControlLabel
                                    key={producer}
                                    control={
                                        <Checkbox
                                            checked={selectedProducers.has(producer)}
                                            onChange={() => toggleSetItem(setSelectedProducers, producer)}
                                            size="small"
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body2" sx={checkboxLabelSx}>{producer}</Typography>}
                                    sx={checkboxRowSx}
                                />
                            ))}
                        </FilterCard>
                    </Box>

                    <Box sx={centerFilterColumnSx}>
                        <FilterCard title={L.FILTER.STATUS_GROUP}>
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

                    <Box sx={rightFilterColumnSx}>
                        <FilterCard title={L.FILTER.AMOUNT_GROUP}>
                            <Slider
                                value={[
                                    Math.max(sliderMin, amountRange[0]),
                                    Math.min(sliderMax, amountRange[1]),
                                ]}
                                min={amountRange[0]}
                                max={amountRange[1]}
                                onChange={(_, val) => {
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
                                    label={L.FILTER.FROM}
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
                                    label={L.FILTER.TO}
                                    value={amountMax}
                                    onChange={(e) => setAmountMax(e.target.value)}
                                    slotProps={{
                                        htmlInput: { type: 'number', max: amountRange[1] },
                                    }}
                                    sx={{ flex: 1, ...filterInputSx }}
                                />
                            </Box>
                        </FilterCard>

                        <FilterCard title={L.FILTER.DATE_GROUP}>
                            <Slider
                                value={[dateSliderFrom, dateSliderTo]}
                                min={dateRange[0]}
                                max={dateRange[1]}
                                onChange={(_, val) => {
                                    setDateFrom(dayjs(val[0]).startOf('day'));
                                    setDateTo(dayjs(val[1]).endOf('day'));
                                }}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(v) => dayjs(v).format('DD.MM.YY')}
                                size="small"
                                sx={{ mt: 1 }}
                            />
                            <Box sx={rangeInputsRowSx}>
                                <DatePicker
                                    label={L.FILTER.FROM}
                                    value={dateFrom}
                                    onChange={(v) => setDateFrom(v)}
                                    maxDate={dateTo ?? undefined}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            sx: { flex: 1, ...filterInputSx },
                                        },
                                    }}
                                />
                                <Typography color="text.secondary">—</Typography>
                                <DatePicker
                                    label={L.FILTER.TO}
                                    value={dateTo}
                                    onChange={(v) => setDateTo(v)}
                                    minDate={dateFrom ?? undefined}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            sx: { flex: 1, ...filterInputSx },
                                        },
                                    }}
                                />
                            </Box>
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
                            {L.FILTER.CLEAR} ({activeFilterCount})
                        </Button>
                    </Box>
                )}
            </Paper>
        </Collapse>
    );
};

export default ActiveOrdersFilters;
