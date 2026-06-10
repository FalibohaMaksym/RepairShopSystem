import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert,
    Stack,
    IconButton,
    TextField,
    Autocomplete,
    CircularProgress,
    Typography,
    Button,
    Collapse,
    FormControl,
    OutlinedInput,
    InputLabel,
    InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { createCustomer, searchCustomers, updateCustomer, deleteCustomer } from '../../../services/customersService';
import {
    createCustomerDevice,
    updateCustomerDevice,
    deleteCustomerDevice,
    fetchCustomerDevicesByCustomerId,
    searchBaseDevices,
    fetchDeviceTypes,
    fetchDeviceProducers,
    fetchDevicePurposes,
    createDeviceProducer,
    createBaseDevice,
    deleteBaseDevice,
} from '../../../services/customerDevicesService';
import { createOrder } from '../../../services/ordersService';
import {
    modalInputSx,
    createDialogPaperSx,
    createDialogContentSx,
    modalTopRightSx,
    modalSearchRowSx,
    modalClientSearchFieldSx,
    modalDeviceSearchFieldSx,
    sectionCardSx,
    customerGridSx,
    deviceGridSx,
    usagePeriodValueSx,
    searchDeviceRowSx,
    modalInnerBlueCardSx,
    modalInnerBlueGridSx,
    modalInnerActionsSx,
    modalCreateClientDeviceButtonSx,
    modalTextareasGridSx,
    modalBottomActionsSx,
} from '../ActiveRepairOrdersPage.styles';
import { resolveBackendErrorMessage } from '../../../app/i18n/backendErrorMap';

const INITIAL_CREATE_ORDER_FORM = {
    searchClient: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    searchClientDevice: '',
    serialNumber: '',
    searchDevice: '',
    deviceType: '',
    deviceProducer: '',
    devicePurpose: '',
    deviceModel: '',
};

const INITIAL_NOTE_VALUES = { outerState: '', problemDescription: '', additionalInfo: '' };

const DEFAULT_USAGE_PERIOD = 20;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatPhoneUa = (rawValue) => {
    const digits = String(rawValue ?? '').replace(/\D/g, '');

    let localDigits = digits;
    if (localDigits.startsWith('380')) {
        localDigits = localDigits.slice(3);
    } else if (localDigits.startsWith('38')) {
        localDigits = localDigits.slice(2);
    }

    localDigits = localDigits.slice(0, 10);

    let result = '';
    if (localDigits.length > 0) {
        result += `(${localDigits.slice(0, 3)}`;
    }
    if (localDigits.length >= 3) {
        result += ')';
    }
    if (localDigits.length > 3) {
        result += ` ${localDigits.slice(3, 6)}`;
    }
    if (localDigits.length > 6) {
        result += `-${localDigits.slice(6, 8)}`;
    }
    if (localDigits.length > 8) {
        result += `-${localDigits.slice(8, 10)}`;
    }

    return result;
};

const ClientSearchAutocomplete = React.memo(({
    open,
    labels,
    onClientPicked,
    selectedClientFromParent,
}) => {
    const [clientOptions, setClientOptions] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientSearchInput, setClientSearchInput] = useState('');

    const formatClientDisplay = useCallback((client) => {
        const name = client?.fullName || '—';
        const phone = client?.phoneNumber || '—';
        const email = client?.email || '—';
        return `${name}\n${phone} | ${email}`;
    }, []);

    useEffect(() => {
        if (!open) {
            setClientOptions([]);
            setClientsLoading(false);
            setSelectedClient(null);
            setClientSearchInput('');
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        if (!selectedClientFromParent) {
            setSelectedClient(null);
            setClientSearchInput('');
            setClientOptions([]);
            setClientsLoading(false);
            return;
        }

        setSelectedClient(selectedClientFromParent);
        setClientSearchInput(formatClientDisplay(selectedClientFromParent));
        setClientOptions([]);
        setClientsLoading(false);
    }, [open, selectedClientFromParent, formatClientDisplay]);

    useEffect(() => {
        if (!open) return;

        if (selectedClient && clientSearchInput === formatClientDisplay(selectedClient)) {
            setClientOptions([]);
            setClientsLoading(false);
            return;
        }

        const query = clientSearchInput.trim();
        if (query.length < 2) {
            setClientOptions([]);
            setClientsLoading(false);
            return;
        }

        let cancelled = false;
        const timeoutId = setTimeout(async () => {
            setClientsLoading(true);
            try {
                const results = await searchCustomers(query);
                if (!cancelled) {
                    setClientOptions(results);
                }
            } catch {
                if (!cancelled) {
                    setClientOptions([]);
                }
            } finally {
                if (!cancelled) {
                    setClientsLoading(false);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [open, clientSearchInput, selectedClient, formatClientDisplay]);

    return (
        <Autocomplete
            freeSolo
            options={clientOptions}
            filterOptions={(options) => options}
            value={selectedClient}
            loading={clientsLoading}
            clearIcon={<CloseIcon fontSize="small" />}
            slotProps={{
                clearIndicator: {
                    size: 'small',
                    'aria-label': labels.CLEAR_SELECTED_CLIENT,
                },
            }}
            getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option?.fullName ?? '';
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            inputValue={clientSearchInput}
            onInputChange={(_, value, reason) => {
                if (selectedClient && reason === 'input') {
                    setClientSearchInput(formatClientDisplay(selectedClient));
                    return;
                }

                if (reason === 'reset') {
                    if (selectedClient) {
                        setClientSearchInput(formatClientDisplay(selectedClient));
                    }
                    return;
                }

                if (reason === 'selectOption') {
                    if (selectedClient) {
                        setClientSearchInput(formatClientDisplay(selectedClient));
                    }
                    return;
                }
                setClientSearchInput(value);
                if (reason === 'input') {
                    setSelectedClient(null);
                    onClientPicked(null);
                }
            }}
            onChange={(_, value) => {
                const pickedClient = typeof value === 'string' ? null : value;
                setSelectedClient(pickedClient);
                if (!pickedClient) {
                    onClientPicked(null);
                    return;
                }

                setClientSearchInput(formatClientDisplay(pickedClient));
                onClientPicked(pickedClient);
            }}
            sx={modalClientSearchFieldSx}
            noOptionsText={labels.NO_RESULTS}
            renderOption={(props, option) => (
                <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25 }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                            {option.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                            {option.phoneNumber || '—'} | {option.email || '—'}
                        </Typography>
                    </Box>
                </li>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder={labels.SEARCH_CLIENT}
                    size="small"
                    multiline={Boolean(selectedClient)}
                    minRows={selectedClient ? 2 : undefined}
                    sx={selectedClient
                        ? {
                            ...modalInputSx,
                            '& .MuiInputBase-root': {
                                ...modalInputSx['& .MuiInputBase-root'],
                                minHeight: { xs: 56, sm: 60 },
                                alignItems: 'flex-start',
                            },
                            '& .MuiInputBase-inputMultiline': {
                                fontSize: '0.83rem',
                                lineHeight: 1.2,
                                py: 0.7,
                                whiteSpace: 'pre-wrap',
                            },
                        }
                        : modalInputSx}
                    InputProps={{
                        ...params.InputProps,
                        readOnly: Boolean(selectedClient),
                        endAdornment: (
                            <>
                                {clientsLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                {params.InputProps?.endAdornment ?? null}
                            </>
                        ),
                    }}
                    inputProps={{
                        ...params.inputProps,
                        readOnly: Boolean(selectedClient),
                    }}
                />
            )}
        />
    );
});

const CustomerDeviceSearchAutocomplete = React.memo(({
    open,
    labels,
    selectedCustomerId,
    disabled,
    onCustomerDevicePicked,
    selectedDeviceFromParent,
}) => {
    const [customerDevices, setCustomerDevices] = useState([]);
    const [deviceOptions, setDeviceOptions] = useState([]);
    const [devicesLoading, setDevicesLoading] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [deviceSearchInput, setDeviceSearchInput] = useState('');

    const formatDeviceDisplay = useCallback((device) => {
        const serial = device?.deviceSerialNumber || '—';
        const model = device?.deviceModel || '—';
        return `${serial}\n${model}`;
    }, []);

    useEffect(() => {
        if (!open) {
            setCustomerDevices([]);
            setDeviceOptions([]);
            setDevicesLoading(false);
            setSelectedDevice(null);
            setDeviceSearchInput('');
        }
    }, [open]);

    useEffect(() => {
        setCustomerDevices([]);
        setDeviceOptions([]);
        setSelectedDevice(null);
        setDeviceSearchInput('');
    }, [selectedCustomerId]);

    useEffect(() => {
        if (!open) return;

        if (!selectedDeviceFromParent) {
            setSelectedDevice(null);
            setDeviceSearchInput('');
            setDeviceOptions([]);
            setDevicesLoading(false);
            return;
        }

        setSelectedDevice(selectedDeviceFromParent);
        setDeviceSearchInput(formatDeviceDisplay(selectedDeviceFromParent));
        setDeviceOptions([]);
        setDevicesLoading(false);
    }, [open, selectedDeviceFromParent, formatDeviceDisplay]);

    useEffect(() => {
        if (!open) return;
        if (!selectedCustomerId) {
            setCustomerDevices([]);
            setDeviceOptions([]);
            setDevicesLoading(false);
            return;
        }

        let cancelled = false;
        setDevicesLoading(true);
        (async () => {
            try {
                const results = await fetchCustomerDevicesByCustomerId(selectedCustomerId);
                if (!cancelled) {
                    setCustomerDevices(results);
                }
            } catch {
                if (!cancelled) {
                    setCustomerDevices([]);
                }
            } finally {
                if (!cancelled) {
                    setDevicesLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, selectedCustomerId]);

    useEffect(() => {
        const normalize = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9а-яіїєґ]/gi, '');
        const rawQuery = deviceSearchInput.trim();

        if (selectedDevice && deviceSearchInput === formatDeviceDisplay(selectedDevice)) {
            setDeviceOptions([]);
            return;
        }

        if (!rawQuery) {
            setDeviceOptions(customerDevices);
            return;
        }

        const query = normalize(rawQuery);

        setDeviceOptions(
            customerDevices.filter((device) => {
                const serial = normalize(device.deviceSerialNumber ?? device.serialNumber);
                const model = normalize(device.deviceModel ?? device.model);
                const customerName = normalize(device.customerFullName ?? device.fullName);
                const producer = normalize(device.producer);
                const deviceType = normalize(device.deviceType ?? device.type);

                return serial.includes(query)
                    || model.includes(query)
                    || customerName.includes(query)
                    || producer.includes(query)
                    || deviceType.includes(query);
            })
        );
    }, [deviceSearchInput, customerDevices, selectedDevice, formatDeviceDisplay]);

    return (
        <Autocomplete
            freeSolo
            disabled={disabled}
            options={deviceOptions}
            filterOptions={(options) => options}
            value={selectedDevice}
            loading={devicesLoading}
            clearIcon={<CloseIcon fontSize="small" />}
            slotProps={{
                clearIndicator: {
                    size: 'small',
                    'aria-label': labels.CLEAR_SELECTED_DEVICE,
                },
            }}
            getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option?.deviceSerialNumber ?? '';
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            inputValue={deviceSearchInput}
            onInputChange={(_, value, reason) => {
                if (selectedDevice && reason === 'input') {
                    setDeviceSearchInput(formatDeviceDisplay(selectedDevice));
                    return;
                }

                if (reason === 'reset') {
                    if (selectedDevice) {
                        setDeviceSearchInput(formatDeviceDisplay(selectedDevice));
                    }
                    return;
                }

                if (reason === 'selectOption') {
                    if (selectedDevice) {
                        setDeviceSearchInput(formatDeviceDisplay(selectedDevice));
                    }
                    return;
                }

                setDeviceSearchInput(value);
                if (reason === 'input') {
                    setSelectedDevice(null);
                    onCustomerDevicePicked(null);
                }
            }}
            onChange={(_, value) => {
                const pickedDevice = typeof value === 'string' ? null : value;
                setSelectedDevice(pickedDevice);
                if (!pickedDevice) {
                    setDeviceSearchInput('');
                    onCustomerDevicePicked(null);
                    return;
                }

                setDeviceSearchInput(formatDeviceDisplay(pickedDevice));
                onCustomerDevicePicked(pickedDevice);
            }}
            sx={modalDeviceSearchFieldSx}
            noOptionsText={selectedCustomerId
                ? labels.NO_RESULTS
                : labels.SELECT_CLIENT_FIRST}
            renderOption={(props, option) => (
                <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25 }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                            {option.deviceSerialNumber || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                            {option.deviceModel || '—'} | {option.customerFullName || '—'}
                        </Typography>
                    </Box>
                </li>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder={labels.SEARCH_CLIENT_DEVICE}
                    size="small"
                    multiline={Boolean(selectedDevice)}
                    minRows={selectedDevice ? 2 : undefined}
                    sx={selectedDevice
                        ? {
                            ...modalInputSx,
                            '& .MuiInputBase-root': {
                                ...modalInputSx['& .MuiInputBase-root'],
                                minHeight: { xs: 56, sm: 60 },
                                alignItems: 'flex-start',
                            },
                            '& .MuiInputBase-inputMultiline': {
                                fontSize: '0.83rem',
                                lineHeight: 1.2,
                                py: 0.7,
                                whiteSpace: 'pre-wrap',
                            },
                        }
                        : modalInputSx}
                    InputProps={{
                        ...params.InputProps,
                        readOnly: Boolean(selectedDevice),
                        endAdornment: (
                            <>
                                {devicesLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                {params.InputProps?.endAdornment ?? null}
                            </>
                        ),
                    }}
                    inputProps={{
                        ...params.inputProps,
                        readOnly: Boolean(selectedDevice),
                    }}
                />
            )}
        />
    );
});

/**
 * Isolated textarea fields for the order form.
 * Manages its own local state so typing never re-renders the heavy CreateOrderModal.
 * Values are exposed to the parent via an imperative ref (getValues()).
 * Resets when `resetToken` changes (device picked / modal closed).
 */
const OrderNoteFields = React.memo(React.forwardRef(({
    labels,
    disabled,
    resetToken,
    initialValues,
    validationError,
    onOuterStateChange,
}, ref) => {
    const [outerState, setOuterState] = useState(initialValues.outerState);
    const [problemDescription, setProblemDescription] = useState(initialValues.problemDescription);
    const [additionalInfo, setAdditionalInfo] = useState(initialValues.additionalInfo);

    useImperativeHandle(ref, () => ({
        getValues: () => ({ outerState, problemDescription, additionalInfo }),
    }), [outerState, problemDescription, additionalInfo]);

    useEffect(() => {
        setOuterState(initialValues.outerState);
        setProblemDescription(initialValues.problemDescription);
        setAdditionalInfo(initialValues.additionalInfo);
    // initialValues is a ref snapshot — resetToken is the real trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetToken]);

    return (
        <Box sx={modalTextareasGridSx}>
            <TextField
                label={labels.DEVICE_OUTER_STATE}
                value={outerState}
                onChange={(e) => {
                    const v = e.target.value;
                    setOuterState(v);
                    onOuterStateChange?.(v);
                }}
                placeholder={labels.INPUT_PLACEHOLDER}
                multiline
                minRows={3}
                size="small"
                disabled={disabled}
                error={Boolean(validationError)}
                helperText={validationError || ' '}
                sx={modalInputSx}
            />
            <TextField
                label={labels.PROBLEM_DESCRIPTION}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder={labels.INPUT_PLACEHOLDER}
                multiline
                minRows={3}
                size="small"
                sx={modalInputSx}
            />
            <TextField
                label={labels.ADDITIONAL_INFO}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder={labels.INPUT_PLACEHOLDER}
                multiline
                minRows={3}
                size="small"
                sx={modalInputSx}
            />
        </Box>
    );
}));

const CreateOrderModal = ({
    open,
    onClose,
    labels,
    onOrderCreated,
}) => {
    const noteFieldsRef = useRef(null);
    const noteInitialRef = useRef(INITIAL_NOTE_VALUES);
    const [noteResetToken, setNoteResetToken] = useState(0);

    const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });
    const openConfirm = useCallback((message, onConfirm) => setConfirmDialog({ open: true, message, onConfirm }), []);
    const closeConfirm = useCallback(() => setConfirmDialog((s) => ({ ...s, open: false })), []);

    const [showCreateClientForm, setShowCreateClientForm] = useState(false);
    const [showCreateClientDeviceForm, setShowCreateClientDeviceForm] = useState(false);
    const [showCreateDeviceForm, setShowCreateDeviceForm] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [selectedClientForAutocomplete, setSelectedClientForAutocomplete] = useState(null);
    const [selectedCustomerDeviceForAutocomplete, setSelectedCustomerDeviceForAutocomplete] = useState(null);
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [isCreatingCustomerDevice, setIsCreatingCustomerDevice] = useState(false);
    const [baseDeviceOptions, setBaseDeviceOptions] = useState([]);
    const [baseDevicesLoading, setBaseDevicesLoading] = useState(false);
    const [baseDeviceInput, setBaseDeviceInput] = useState('');
    const [selectedBaseDevice, setSelectedBaseDevice] = useState(null);
    const [deviceTypeOptions, setDeviceTypeOptions] = useState([]);
    const [producerOptions, setProducerOptions] = useState([]);
    const [purposeOptions, setPurposeOptions] = useState([]);
    const [deviceTypeInput, setDeviceTypeInput] = useState('');
    const [producerInput, setProducerInput] = useState('');
    const [purposeInput, setPurposeInput] = useState('');
    const [deviceMetaLoading, setDeviceMetaLoading] = useState(false);
    const [deviceMetaFetchFailed, setDeviceMetaFetchFailed] = useState(false);
    const [creatingLookupKey, setCreatingLookupKey] = useState('');
    const [isCreatingBaseDevice, setIsCreatingBaseDevice] = useState(false);
    const [outerStateValidationError, setOuterStateValidationError] = useState('');
    const [customerEmailError, setCustomerEmailError]               = useState('');
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [usagePeriod, setUsagePeriod] = useState(DEFAULT_USAGE_PERIOD);
    const [createOrderForm, setCreateOrderForm] = useState(INITIAL_CREATE_ORDER_FORM);

    const formatI18n = useCallback(
        (template, values = {}) => String(template ?? '').replace(/\{(\w+)\}/g, (_, key) => values[key] ?? ''),
        []
    );

    const showNotification = useCallback((message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    }, []);

    const closeNotification = useCallback((_, reason) => {
        if (reason === 'clickaway') return;
        setNotification((prev) => ({ ...prev, open: false }));
    }, []);

    const getErrorMessage = useCallback(
        (error, fallbackMessage) => resolveBackendErrorMessage(error, labels, fallbackMessage),
        [labels]
    );

    const formatBaseDeviceDisplay = useCallback((device) => {
        const model = device?.deviceModel || '—';
        const type = device?.deviceType || '—';
        const producer = device?.producer || '—';
        return `${model}\n${type} | ${producer}`;
    }, []);

    const repairMojibake = useCallback((value) => {
        const text = String(value ?? '').trim();
        if (!text) return '';

        // Backend may return UTF-8 bytes interpreted as latin1 (e.g. "Ð..."), repair it for display/search.
        if (!/[ÐÑ]/.test(text)) return text;

        try {
            const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0));
            const decoded = new TextDecoder('utf-8').decode(bytes).trim();
            return decoded || text;
        } catch {
            return text;
        }
    }, []);

    const normalizeText = useCallback(
        (value) => repairMojibake(value).toLowerCase().replace(/\s+/g, ' ').trim(),
        [repairMojibake]
    );

    const mapLookupOption = useCallback(
        (item) => ({
            id: item?.id ?? item?.value ?? null,
            name: repairMojibake(item?.name ?? item?.deviceTypeName ?? item?.producerCompanyName ?? item?.devicePurpose ?? ''),
        }),
        [repairMojibake]
    );

    const buildUniqueLookupFromDevices = useCallback((devices, field) => {
        const seen = new Set();
        const options = [];

        devices.forEach((item) => {
            const name = repairMojibake(item?.[field]);
            if (!name) return;

            const key = name.toLowerCase();
            if (seen.has(key)) return;

            seen.add(key);
            options.push({
                id: `${field}-${key}`,
                name,
            });
        });

        return options;
    }, [repairMojibake]);

    const filterLookupOptions = useCallback(
        (options, state) => {
            const query = normalizeText(state.inputValue);
            if (!query) return options;

            return options.filter((option) => normalizeText(option.name).includes(query));
        },
        [normalizeText]
    );

    const resolveLookupNumericId = useCallback((options, rawName) => {
        const normalizedName = normalizeText(rawName);
        if (!normalizedName) return null;

        const matched = options.find((item) => normalizeText(item.name) === normalizedName);
        const parsedId = Number(matched?.id);
        return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
    }, [normalizeText]);

    const setCreateField = useCallback((field) => (event) => {
        setCreateOrderForm((prev) => ({ ...prev, [field]: event.target.value }));
    }, []);

    const handleOuterStateChange = useCallback((value) => {
        if (outerStateValidationError && value.trim()) {
            setOuterStateValidationError('');
        }
    }, [outerStateValidationError]);

    const handleCreateLookupValue = useCallback(async (lookupType) => {
        if (!selectedCustomerId) return;

        if (lookupType === 'producer') {
            const name = producerInput.trim();
            if (!name) return;

            setCreatingLookupKey(lookupType);
            try {
                const created = mapLookupOption(await createDeviceProducer(name));
                if (!created.id || !created.name) return;

                setProducerOptions((prev) => {
                    const exists = prev.some((item) => item.name.toLowerCase() === created.name.toLowerCase());
                    return exists ? prev : [...prev, created];
                });
                setProducerInput(created.name);
                setCreateOrderForm((prev) => ({ ...prev, deviceProducer: created.name }));
                showNotification(labels.PRODUCER_CREATED, 'success');
            } catch (error) {
                showNotification(getErrorMessage(error, labels.PRODUCER_CREATE_FAILED), 'error');
            } finally {
                setCreatingLookupKey('');
            }
        }
    }, [
        selectedCustomerId,
        producerInput,
        mapLookupOption,
        labels.PRODUCER_CREATED,
        labels.PRODUCER_CREATE_FAILED,
        showNotification,
        getErrorMessage,
    ]);

    const handleCustomerEmailChange = useCallback((event) => {
        const value = event.target.value;
        setCreateOrderForm((prev) => ({ ...prev, customerEmail: value }));
        const trimmed = value.trim();
        setCustomerEmailError(trimmed && !EMAIL_REGEX.test(trimmed) ? (labels.CUSTOMER_EMAIL_INVALID ?? 'Невірний формат email') : '');
    }, [labels.CUSTOMER_EMAIL_INVALID]);

    const handleCustomerPhoneChange = useCallback((event) => {
        const maskedPhone = formatPhoneUa(event.target.value);
        setCreateOrderForm((prev) => ({ ...prev, customerPhone: maskedPhone }));
    }, []);

    useEffect(() => {
        if (!open) {
            setShowCreateClientForm(false);
            setShowCreateClientDeviceForm(false);
            setShowCreateDeviceForm(false);
            setSelectedCustomerId(null);
            setSelectedClientForAutocomplete(null);
            setSelectedCustomerDeviceForAutocomplete(null);
            setIsCreatingClient(false);
            setIsCreatingCustomerDevice(false);
            setBaseDeviceOptions([]);
            setBaseDevicesLoading(false);
            setBaseDeviceInput('');
            setSelectedBaseDevice(null);
            setDeviceTypeOptions([]);
            setProducerOptions([]);
            setPurposeOptions([]);
            setDeviceTypeInput('');
            setProducerInput('');
            setPurposeInput('');
            setDeviceMetaLoading(false);
            setDeviceMetaFetchFailed(false);
            setOuterStateValidationError('');
            setCustomerEmailError('');
            setIsSubmittingOrder(false);
            setUsagePeriod(DEFAULT_USAGE_PERIOD);
            setCreateOrderForm(INITIAL_CREATE_ORDER_FORM);
            noteInitialRef.current = INITIAL_NOTE_VALUES;
            setNoteResetToken(0);
        }
    }, [open]);

    useEffect(() => {
        if (!open || !showCreateDeviceForm || !selectedCustomerId) {
            setDeviceMetaLoading(false);
            return;
        }

        let cancelled = false;
        setDeviceMetaLoading(true);

        (async () => {
            try {
                const [types, producers, purposes] = await Promise.all([
                    fetchDeviceTypes(),
                    fetchDeviceProducers(),
                    fetchDevicePurposes(),
                ]);

                if (cancelled) return;

                setDeviceTypeOptions(types.map(mapLookupOption).filter((item) => item.id && item.name));
                setProducerOptions(producers.map(mapLookupOption).filter((item) => item.id && item.name));
                setPurposeOptions(purposes.map(mapLookupOption).filter((item) => item.id && item.name));
                setDeviceMetaFetchFailed(false);
            } catch {
                if (cancelled) return;
                setDeviceTypeOptions([]);
                setProducerOptions([]);
                setPurposeOptions([]);
                setDeviceMetaFetchFailed(true);
            } finally {
                if (!cancelled) {
                    setDeviceMetaLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, showCreateDeviceForm, selectedCustomerId, mapLookupOption]);

    useEffect(() => {
        if (!open || !showCreateDeviceForm || !selectedCustomerId || !deviceMetaFetchFailed) return;

        const query = deviceTypeInput.trim();
        if (query.length < 2) return;

        let cancelled = false;
        const timeoutId = setTimeout(async () => {
            try {
                const devices = await searchBaseDevices(query);
                if (cancelled) return;
                setDeviceTypeOptions(buildUniqueLookupFromDevices(devices, 'deviceType'));
            } catch {
                if (!cancelled) {
                    setDeviceTypeOptions([]);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [open, showCreateDeviceForm, selectedCustomerId, deviceMetaFetchFailed, deviceTypeInput, buildUniqueLookupFromDevices]);

    useEffect(() => {
        if (!open || !showCreateDeviceForm || !selectedCustomerId || !deviceMetaFetchFailed) return;

        const query = producerInput.trim();
        if (query.length < 2) return;

        let cancelled = false;
        const timeoutId = setTimeout(async () => {
            try {
                const devices = await searchBaseDevices(query);
                if (cancelled) return;
                setProducerOptions(buildUniqueLookupFromDevices(devices, 'producer'));
            } catch {
                if (!cancelled) {
                    setProducerOptions([]);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [open, showCreateDeviceForm, selectedCustomerId, deviceMetaFetchFailed, producerInput, buildUniqueLookupFromDevices]);

    useEffect(() => {
        if (!open || !showCreateDeviceForm || !selectedCustomerId || !deviceMetaFetchFailed) return;

        const query = purposeInput.trim();
        if (query.length < 2) return;

        let cancelled = false;
        const timeoutId = setTimeout(async () => {
            try {
                const devices = await searchBaseDevices(query);
                if (cancelled) return;
                setPurposeOptions(buildUniqueLookupFromDevices(devices, 'devicePurpose'));
            } catch {
                if (!cancelled) {
                    setPurposeOptions([]);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [open, showCreateDeviceForm, selectedCustomerId, deviceMetaFetchFailed, purposeInput, buildUniqueLookupFromDevices]);

    useEffect(() => {
        if (!open || !selectedCustomerId) {
            setBaseDeviceOptions([]);
            setBaseDevicesLoading(false);
            setBaseDeviceInput('');
            setSelectedBaseDevice(null);
            return;
        }

        if (selectedBaseDevice && baseDeviceInput === formatBaseDeviceDisplay(selectedBaseDevice)) {
            setBaseDevicesLoading(false);
            return;
        }

        const query = baseDeviceInput.trim();
        if (query.length < 2) {
            setBaseDeviceOptions([]);
            setBaseDevicesLoading(false);
            return;
        }

        let cancelled = false;
        const timeoutId = setTimeout(async () => {
            setBaseDevicesLoading(true);

            try {
                const baseDevices = await searchBaseDevices(query);

                if (cancelled) return;

                setBaseDeviceOptions(
                    baseDevices.map((item) => ({
                        id: item.id,
                        deviceModel: item.deviceModel ?? '',
                        deviceType: item.deviceType ?? '',
                        producer: item.producer ?? '',
                        devicePurpose: item.devicePurpose ?? '',
                    }))
                );
            } catch {
                if (!cancelled) {
                    setBaseDeviceOptions([]);
                }
            } finally {
                if (!cancelled) {
                    setBaseDevicesLoading(false);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [open, selectedCustomerId, selectedBaseDevice, baseDeviceInput, formatBaseDeviceDisplay]);

    const normalizePhoneForApi = useCallback((phoneValue) => {
        const digits = String(phoneValue ?? '').replace(/\D/g, '');
        if (!digits) return '';

        if (digits.startsWith('380')) {
            return `+${digits.slice(0, 12)}`;
        }
        if (digits.startsWith('38')) {
            return `+${digits.slice(0, 12)}`;
        }
        if (digits.length === 10 && digits.startsWith('0')) {
            return `+38${digits}`;
        }

        return `+${digits.slice(0, 15)}`;
    }, []);

    const handleClientPicked = useCallback((pickedClient) => {
        setSelectedClientForAutocomplete(pickedClient ?? null);

        const resetDeviceDependentState = () => {
            setSelectedCustomerDeviceForAutocomplete(null);
            setSelectedBaseDevice(null);
            setBaseDeviceInput('');
            setBaseDeviceOptions([]);
            setDeviceTypeInput('');
            setProducerInput('');
            setPurposeInput('');
            setDeviceTypeOptions([]);
            setProducerOptions([]);
            setPurposeOptions([]);
            setShowCreateClientDeviceForm(false);
            setShowCreateDeviceForm(false);
            setOuterStateValidationError('');
            setUsagePeriod(DEFAULT_USAGE_PERIOD);
        };

        if (!pickedClient) {
            setShowCreateClientForm(false);
            setSelectedCustomerId(null);
            resetDeviceDependentState();
            noteInitialRef.current = INITIAL_NOTE_VALUES;
            setNoteResetToken((t) => t + 1);
            setCreateOrderForm((prev) => ({
                ...prev,
                searchClient: '',
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                searchClientDevice: '',
                serialNumber: '',
                searchDevice: '',
                deviceType: '',
                deviceProducer: '',
                devicePurpose: '',
                deviceModel: '',
            }));
            return;
        }

        resetDeviceDependentState();
        setCustomerEmailError('');
        setSelectedCustomerId(pickedClient.id ?? null);
        setCreateOrderForm((prev) => ({
            ...prev,
            searchClient: pickedClient.fullName ?? prev.searchClient,
            customerName: pickedClient.fullName ?? '',
            customerEmail: pickedClient.email ?? '',
            customerPhone: pickedClient.phoneNumber ?? '',
        }));
    }, []);

    const handleCreateCustomer = useCallback(async () => {
        const fullName = createOrderForm.customerName.trim();
        if (!fullName) return;
        const emailTrimmed = createOrderForm.customerEmail.trim();
        if (emailTrimmed && !EMAIL_REGEX.test(emailTrimmed)) {
            setCustomerEmailError(labels.CUSTOMER_EMAIL_INVALID ?? 'Невірний формат email');
            return;
        }

        const selectedCustomerIdForUpdate = selectedClientForAutocomplete?.id;
        setIsCreatingClient(true);
        try {
            const payload = {
                fullName,
                email: createOrderForm.customerEmail.trim() || undefined,
                phoneNumber: normalizePhoneForApi(createOrderForm.customerPhone) || undefined,
            };

            const createdCustomer = selectedCustomerIdForUpdate
                ? await updateCustomer(selectedCustomerIdForUpdate, payload)
                : await createCustomer(payload);
            setShowCreateClientForm(false);
            handleClientPicked(createdCustomer);
            showNotification(selectedCustomerIdForUpdate ? labels.CUSTOMER_UPDATED : labels.CUSTOMER_CREATED, 'success');
        } catch (error) {
            showNotification(
                getErrorMessage(error, selectedCustomerIdForUpdate ? labels.CUSTOMER_UPDATE_FAILED : labels.CUSTOMER_CREATE_FAILED),
                'error'
            );
        } finally {
            setIsCreatingClient(false);
        }
    }, [
        selectedClientForAutocomplete,
        createOrderForm.customerEmail,
        createOrderForm.customerName,
        createOrderForm.customerPhone,
        handleClientPicked,
        normalizePhoneForApi,
        labels.CUSTOMER_EMAIL_INVALID,
        labels.CUSTOMER_UPDATED,
        labels.CUSTOMER_CREATED,
        labels.CUSTOMER_UPDATE_FAILED,
        labels.CUSTOMER_CREATE_FAILED,
        showNotification,
        getErrorMessage,
    ]);

    const handleCustomerDevicePicked = useCallback((pickedDevice) => {
        setSelectedCustomerDeviceForAutocomplete(pickedDevice ?? null);

        if (!pickedDevice) {
            setSelectedBaseDevice(null);
            setBaseDeviceInput('');
            setBaseDeviceOptions([]);
            setShowCreateDeviceForm(false);
            setDeviceTypeInput('');
            setProducerInput('');
            setPurposeInput('');
            setDeviceTypeOptions([]);
            setProducerOptions([]);
            setPurposeOptions([]);
            setUsagePeriod(DEFAULT_USAGE_PERIOD);
            setOuterStateValidationError('');
            noteInitialRef.current = INITIAL_NOTE_VALUES;
            setNoteResetToken((t) => t + 1);
            setCreateOrderForm((prev) => ({
                ...prev,
                searchClientDevice: '',
                serialNumber: '',
                searchDevice: '',
                deviceType: '',
                deviceProducer: '',
                devicePurpose: '',
                deviceModel: '',
            }));
            return;
        }

        setOuterStateValidationError('');
        noteInitialRef.current = {
            outerState: pickedDevice.externalConditionDescription ?? '',
            problemDescription: '',
            additionalInfo: pickedDevice.deviceAdditionalInfo ?? '',
        };
        setNoteResetToken((t) => t + 1);
        setCreateOrderForm((prev) => ({
            ...prev,
            searchClientDevice: pickedDevice.deviceSerialNumber ?? prev.searchClientDevice,
            serialNumber: pickedDevice.deviceSerialNumber ?? '',
            searchDevice: pickedDevice.deviceModel ?? '',
            deviceType: pickedDevice.deviceType ?? '',
            deviceProducer: pickedDevice.producer ?? '',
            deviceModel: pickedDevice.deviceModel ?? '',
        }));

        const pickedBase = {
            id: pickedDevice.deviceId ?? null,
            deviceModel: pickedDevice.deviceModel ?? '',
            deviceType: pickedDevice.deviceType ?? '',
            producer: pickedDevice.producer ?? '',
        };
        setSelectedBaseDevice(pickedBase.id ? pickedBase : null);
        setBaseDeviceInput(pickedBase.id ? formatBaseDeviceDisplay(pickedBase) : '');

        if (typeof pickedDevice.deviceUsageTime === 'number') {
            setUsagePeriod(pickedDevice.deviceUsageTime);
        }
    }, [formatBaseDeviceDisplay]);

    const handleCreateCustomerDevice = useCallback(async () => {
        if (!selectedCustomerId || !selectedBaseDevice?.id) return;

        const serial = createOrderForm.serialNumber.trim();
        const noteValues = noteFieldsRef.current?.getValues() ?? INITIAL_NOTE_VALUES;
        const condition = noteValues.outerState.trim();
        if (!serial) return;
        if (!condition) {
            setOuterStateValidationError(labels.OUTER_STATE_REQUIRED);
            return;
        }

        const selectedCustomerDeviceIdForUpdate = selectedCustomerDeviceForAutocomplete?.id;
        setOuterStateValidationError('');

        setIsCreatingCustomerDevice(true);
        try {
            const payload = {
                deviceSerialNumber: serial,
                externalConditionDescription: condition,
                deviceUsageTime: usagePeriod,
                deviceAdditionalInfo: noteValues.additionalInfo.trim() || undefined,
                deviceId: selectedBaseDevice.id,
            };

            const createdCustomerDevice = selectedCustomerDeviceIdForUpdate
                ? await updateCustomerDevice(selectedCustomerDeviceIdForUpdate, payload)
                : await createCustomerDevice({ ...payload, customerId: selectedCustomerId });
            handleCustomerDevicePicked(createdCustomerDevice);
            setShowCreateClientDeviceForm(false);
            setShowCreateDeviceForm(false);
            showNotification(
                selectedCustomerDeviceIdForUpdate
                    ? labels.CUSTOMER_DEVICE_UPDATED
                    : labels.CUSTOMER_DEVICE_CREATED,
                'success'
            );
        } catch (error) {
            showNotification(
                getErrorMessage(
                    error,
                    selectedCustomerDeviceIdForUpdate
                        ? labels.CUSTOMER_DEVICE_UPDATE_FAILED
                        : labels.CUSTOMER_DEVICE_CREATE_FAILED
                ),
                'error'
            );
        } finally {
            setIsCreatingCustomerDevice(false);
        }
    }, [
        selectedCustomerId,
        selectedCustomerDeviceForAutocomplete,
        selectedBaseDevice,
        createOrderForm.serialNumber,
        usagePeriod,
        handleCustomerDevicePicked,
        labels.OUTER_STATE_REQUIRED,
        labels.CUSTOMER_DEVICE_UPDATED,
        labels.CUSTOMER_DEVICE_CREATED,
        labels.CUSTOMER_DEVICE_UPDATE_FAILED,
        labels.CUSTOMER_DEVICE_CREATE_FAILED,
        showNotification,
        getErrorMessage,
    ]);

    const handleCreateBaseDevice = useCallback(async () => {
        if (!selectedCustomerId) return;

        const model = createOrderForm.deviceModel.trim();
        const deviceTypeId = resolveLookupNumericId(deviceTypeOptions, createOrderForm.deviceType);
        const producerId = resolveLookupNumericId(producerOptions, createOrderForm.deviceProducer);
        const devicePurposeId = resolveLookupNumericId(purposeOptions, createOrderForm.devicePurpose);

        if (!model || !deviceTypeId || !producerId) return;

        setIsCreatingBaseDevice(true);
        try {
            const created = await createBaseDevice({
                deviceModel: model,
                deviceTypeId,
                producerId,
                devicePurposeId: devicePurposeId ?? undefined,
            });

            const pickedBaseDevice = {
                id: created?.id ?? null,
                deviceModel: created?.deviceModel ?? model,
                deviceType: created?.deviceType ?? createOrderForm.deviceType,
                producer: created?.producer ?? createOrderForm.deviceProducer,
                devicePurpose: created?.devicePurpose ?? createOrderForm.devicePurpose,
            };

            if (!pickedBaseDevice.id) return;

            setSelectedBaseDevice(pickedBaseDevice);
            setBaseDeviceInput(formatBaseDeviceDisplay(pickedBaseDevice));
            setCreateOrderForm((prev) => ({
                ...prev,
                searchDevice: pickedBaseDevice.deviceModel ?? '',
                deviceType: pickedBaseDevice.deviceType ?? '',
                deviceProducer: pickedBaseDevice.producer ?? '',
                devicePurpose: pickedBaseDevice.devicePurpose ?? '',
                deviceModel: pickedBaseDevice.deviceModel ?? '',
            }));
            setShowCreateDeviceForm(false);
            showNotification(labels.BASE_DEVICE_CREATED, 'success');
        } catch (error) {
            showNotification(getErrorMessage(error, labels.BASE_DEVICE_CREATE_FAILED), 'error');
        } finally {
            setIsCreatingBaseDevice(false);
        }
    }, [
        selectedCustomerId,
        createOrderForm.deviceModel,
        createOrderForm.deviceType,
        createOrderForm.deviceProducer,
        createOrderForm.devicePurpose,
        resolveLookupNumericId,
        deviceTypeOptions,
        producerOptions,
        purposeOptions,
        formatBaseDeviceDisplay,
        labels.BASE_DEVICE_CREATED,
        labels.BASE_DEVICE_CREATE_FAILED,
        showNotification,
        getErrorMessage,
    ]);

    const handleDeleteSelectedCustomer = useCallback(() => {
        const customerId = selectedClientForAutocomplete?.id;
        if (!customerId) return;
        openConfirm(labels.CONFIRM_DELETE_CUSTOMER, async () => {
            try {
                await deleteCustomer(customerId);
                handleClientPicked(null);
                setShowCreateClientForm(false);
                showNotification(labels.CUSTOMER_DELETED, 'success');
            } catch (error) {
                showNotification(getErrorMessage(error, labels.CUSTOMER_DELETE_FAILED), 'error');
            }
        });
    }, [
        selectedClientForAutocomplete,
        handleClientPicked,
        labels.CONFIRM_DELETE_CUSTOMER,
        labels.CUSTOMER_DELETED,
        labels.CUSTOMER_DELETE_FAILED,
        showNotification,
        getErrorMessage,
        openConfirm,
    ]);

    const handleDeleteSelectedCustomerDevice = useCallback(() => {
        const customerDeviceId = selectedCustomerDeviceForAutocomplete?.id;
        if (!customerDeviceId) return;
        openConfirm(labels.CONFIRM_DELETE_CUSTOMER_DEVICE, async () => {
            try {
                await deleteCustomerDevice(customerDeviceId);
                handleCustomerDevicePicked(null);
                setShowCreateClientDeviceForm(false);
                setShowCreateDeviceForm(false);
                showNotification(labels.CUSTOMER_DEVICE_DELETED, 'success');
            } catch (error) {
                showNotification(getErrorMessage(error, labels.CUSTOMER_DEVICE_DELETE_FAILED), 'error');
            }
        });
    }, [
        selectedCustomerDeviceForAutocomplete,
        handleCustomerDevicePicked,
        labels.CONFIRM_DELETE_CUSTOMER_DEVICE,
        labels.CUSTOMER_DEVICE_DELETED,
        labels.CUSTOMER_DEVICE_DELETE_FAILED,
        showNotification,
        getErrorMessage,
        openConfirm,
    ]);

    const handleDeleteSelectedBaseDevice = useCallback(() => {
        const baseDeviceId = selectedBaseDevice?.id;
        if (!baseDeviceId) return;
        openConfirm(labels.CONFIRM_DELETE_BASE_DEVICE, async () => {
            try {
                await deleteBaseDevice(baseDeviceId);
                setSelectedBaseDevice(null);
                setBaseDeviceInput('');
                setCreateOrderForm((prev) => ({
                    ...prev,
                    searchDevice: '',
                    deviceType: '',
                    deviceProducer: '',
                    devicePurpose: '',
                    deviceModel: '',
                }));
                showNotification(labels.BASE_DEVICE_DELETED, 'success');
            } catch (error) {
                showNotification(getErrorMessage(error, labels.BASE_DEVICE_DELETE_FAILED), 'error');
            }
        });
    }, [
        selectedBaseDevice,
        labels.CONFIRM_DELETE_BASE_DEVICE,
        labels.BASE_DEVICE_DELETED,
        labels.BASE_DEVICE_DELETE_FAILED,
        showNotification,
        getErrorMessage,
        openConfirm,
    ]);

    const handleSubmitOrder = useCallback(async () => {
        const selectedCustomerDeviceId = selectedCustomerDeviceForAutocomplete?.id;
        if (!selectedCustomerDeviceId) {
            showNotification(labels.SELECT_CUSTOMER_DEVICE_BEFORE_ORDER, 'error');
            return;
        }

        const serial = createOrderForm.serialNumber.trim();
        const noteValues = noteFieldsRef.current?.getValues() ?? INITIAL_NOTE_VALUES;
        const condition = noteValues.outerState.trim();

        if (!serial || !selectedBaseDevice?.id) {
            showNotification(labels.FILL_SERIAL_AND_BASE_DEVICE, 'error');
            return;
        }

        if (!condition) {
            setOuterStateValidationError(labels.OUTER_STATE_REQUIRED);
            return;
        }

        setOuterStateValidationError('');
        setIsSubmittingOrder(true);
        try {
            await updateCustomerDevice(selectedCustomerDeviceId, {
                deviceSerialNumber: serial,
                externalConditionDescription: condition,
                deviceUsageTime: usagePeriod,
                deviceAdditionalInfo: noteValues.additionalInfo.trim() || undefined,
                deviceId: selectedBaseDevice.id,
            });

            const createdOrder = await createOrder({
                customerDeviceId: selectedCustomerDeviceId,
                problemDescription: noteValues.problemDescription.trim() || undefined,
            });

            if (typeof onOrderCreated === 'function') {
                onOrderCreated(createdOrder);
            }

            showNotification(
                formatI18n(labels.ORDER_CREATED, { orderNumber: createdOrder?.orderNumber || '' }),
                'success'
            );
            setTimeout(() => {
                onClose();
            }, 600);
        } catch (error) {
            showNotification(getErrorMessage(error, labels.CREATE_ORDER_FAILED), 'error');
        } finally {
            setIsSubmittingOrder(false);
        }
    }, [
        selectedCustomerDeviceForAutocomplete,
        createOrderForm.serialNumber,
        selectedBaseDevice,
        usagePeriod,
        onClose,
        onOrderCreated,
        labels.SELECT_CUSTOMER_DEVICE_BEFORE_ORDER,
        labels.FILL_SERIAL_AND_BASE_DEVICE,
        labels.OUTER_STATE_REQUIRED,
        labels.ORDER_CREATED,
        labels.CREATE_ORDER_FAILED,
        formatI18n,
        showNotification,
        getErrorMessage,
    ]);

    const isClientSelected = Boolean(selectedCustomerId);

    return (
        <>
            <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xl"
            PaperProps={{
                sx: createDialogPaperSx,
            }}
        >
            <DialogContent sx={createDialogContentSx}>
                <Stack spacing={1}>
                    <Box sx={modalTopRightSx}>
                        <IconButton size="small" onClick={onClose}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box sx={modalSearchRowSx}>
                        <ClientSearchAutocomplete
                            open={open}
                            labels={labels}
                            onClientPicked={handleClientPicked}
                            selectedClientFromParent={selectedClientForAutocomplete}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Button
                                type="button"
                                variant="text"
                                size="small"
                                startIcon={<AddIcon fontSize="small" />}
                                onClick={() => setShowCreateClientForm((prev) => !prev)}
                                sx={{ textTransform: 'none', minWidth: 'auto', px: 0.5 }}
                            >
                                {selectedClientForAutocomplete?.id ? labels.EDIT_CUSTOMER : labels.CREATE_NEW}
                            </Button>
                            <Button
                                type="button"
                                variant="text"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon fontSize="small" />}
                                disabled={!selectedClientForAutocomplete?.id}
                                onClick={handleDeleteSelectedCustomer}
                                sx={{ textTransform: 'none', minWidth: 'auto', px: 0.5 }}
                            >
                                {labels.DELETE}
                            </Button>
                        </Box>
                    </Box>

                    <Collapse in={showCreateClientForm}>
                        <Box sx={sectionCardSx}>
                            <Box sx={customerGridSx}>
                                <TextField
                                    label={labels.CUSTOMER_FULL_NAME}
                                    value={createOrderForm.customerName}
                                    onChange={setCreateField('customerName')}
                                    placeholder={labels.INPUT_PLACEHOLDER}
                                    size="small"
                                    helperText={labels.INPUT_PLACEHOLDER}
                                    inputProps={{ maxLength: 70 }}
                                    sx={modalInputSx}
                                />
                                <TextField
                                    label={labels.CUSTOMER_EMAIL}
                                    value={createOrderForm.customerEmail}
                                    onChange={handleCustomerEmailChange}
                                    placeholder={labels.EMAIL_PLACEHOLDER}
                                    size="small"
                                    error={Boolean(customerEmailError)}
                                    helperText={customerEmailError || labels.INPUT_PLACEHOLDER}
                                    inputProps={{ maxLength: 70 }}
                                    sx={modalInputSx}
                                />
                                <TextField
                                    label={labels.CUSTOMER_PHONE}
                                    value={createOrderForm.customerPhone}
                                    onChange={handleCustomerPhoneChange}
                                    placeholder={labels.PHONE_PLACEHOLDER}
                                    size="small"
                                    helperText={labels.INPUT_PLACEHOLDER}
                                    inputProps={{
                                        inputMode: 'numeric',
                                        maxLength: 15,
                                    }}
                                    sx={modalInputSx}
                                />
                            </Box>

                            <Box sx={modalInnerActionsSx}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        setShowCreateClientForm(false);
                                        setCreateOrderForm((prev) => ({
                                            ...prev,
                                            customerName: '',
                                            customerEmail: '',
                                            customerPhone: '',
                                        }));
                                    }}
                                >
                                    {labels.CANCEL}
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    disabled={isCreatingClient || !createOrderForm.customerName.trim()}
                                    startIcon={<AddIcon fontSize="small" />}
                                    onClick={handleCreateCustomer}
                                >
                                    {selectedClientForAutocomplete?.id ? labels.SAVE_CHANGES : labels.CREATE}
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>

                    <Box sx={modalSearchRowSx}>
                        <CustomerDeviceSearchAutocomplete
                            open={open}
                            labels={labels}
                            selectedCustomerId={selectedCustomerId}
                            disabled={!isClientSelected}
                            onCustomerDevicePicked={handleCustomerDevicePicked}
                            selectedDeviceFromParent={selectedCustomerDeviceForAutocomplete}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Button
                                type="button"
                                variant="text"
                                size="small"
                                startIcon={<AddIcon fontSize="small" />}
                                disabled={!isClientSelected}
                                onClick={() => setShowCreateClientDeviceForm((prev) => !prev)}
                                sx={{ textTransform: 'none', minWidth: 'auto', px: 0.5 }}
                            >
                                {selectedCustomerDeviceForAutocomplete?.id ? labels.EDIT_CUSTOMER_DEVICE : labels.CREATE_NEW}
                            </Button>
                            <Button
                                type="button"
                                variant="text"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon fontSize="small" />}
                                disabled={!selectedCustomerDeviceForAutocomplete?.id}
                                onClick={handleDeleteSelectedCustomerDevice}
                                sx={{ textTransform: 'none', minWidth: 'auto', px: 0.5 }}
                            >
                                {labels.DELETE}
                            </Button>
                        </Box>
                    </Box>

                    <Collapse in={showCreateClientDeviceForm}>
                        <Box sx={sectionCardSx}>
                            <Box sx={deviceGridSx}>
                                <TextField
                                    label={labels.DEVICE_SERIAL_NUMBER}
                                    value={createOrderForm.serialNumber}
                                    onChange={setCreateField('serialNumber')}
                                    placeholder={labels.SERIAL_PLACEHOLDER}
                                    size="small"
                                    disabled={!isClientSelected}
                                    helperText={labels.INPUT_PLACEHOLDER}
                                    inputProps={{ maxLength: 20 }}
                                    sx={modalInputSx}
                                />

                                <FormControl
                                    size="small"
                                    disabled={!isClientSelected}
                                    sx={{
                                        ...modalInputSx,
                                        width: '100%',
                                        minWidth: { sm: 220 },
                                        '& .MuiInputBase-input': {
                                            ...modalInputSx['& .MuiInputBase-input'],
                                            textAlign: 'center',
                                            px: 0,
                                        },
                                    }}
                                >
                                    <InputLabel shrink>{labels.DEVICE_USAGE_PERIOD}</InputLabel>
                                    <OutlinedInput
                                        notched
                                        label={labels.DEVICE_USAGE_PERIOD}
                                        readOnly
                                        value={usagePeriod}
                                        inputProps={{
                                            'aria-label': labels.DEVICE_USAGE_PERIOD,
                                        }}
                                        startAdornment={(
                                            <InputAdornment position="start" sx={{ mr: 0.25 }}>
                                                <IconButton
                                                    size="small"
                                                    disabled={!isClientSelected}
                                                    onClick={() => setUsagePeriod((v) => Math.max(0, v - 1))}
                                                >
                                                    <RemoveIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        )}
                                        endAdornment={(
                                            <InputAdornment position="end" sx={{ ml: 0.25 }}>
                                                <IconButton
                                                    size="small"
                                                    disabled={!isClientSelected}
                                                    onClick={() => setUsagePeriod((v) => v + 1)}
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        )}
                                        sx={{
                                            '& .MuiOutlinedInput-notchedOutline legend': {
                                                maxWidth: '100%'
                                            },
                                        }}
                                    />
                                </FormControl>

                                <Box sx={searchDeviceRowSx}>
                                    <Autocomplete
                                        freeSolo
                                        disabled={!isClientSelected}
                                        options={baseDeviceOptions}
                                        loading={baseDevicesLoading}
                                        filterOptions={(options) => options}
                                        value={selectedBaseDevice}
                                        inputValue={baseDeviceInput}
                                        getOptionLabel={(option) => {
                                            if (typeof option === 'string') return option;
                                            return option?.deviceModel ?? '';
                                        }}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        onInputChange={(_, value, reason) => {
                                            if (selectedBaseDevice && reason === 'input') {
                                                setBaseDeviceInput(formatBaseDeviceDisplay(selectedBaseDevice));
                                                return;
                                            }

                                            if (selectedBaseDevice && reason === 'reset') {
                                                setBaseDeviceInput(formatBaseDeviceDisplay(selectedBaseDevice));
                                                return;
                                            }

                                            if (reason === 'selectOption') {
                                                if (selectedBaseDevice) {
                                                    setBaseDeviceInput(formatBaseDeviceDisplay(selectedBaseDevice));
                                                }
                                                return;
                                            }

                                            setBaseDeviceInput(value);
                                            setCreateOrderForm((prev) => ({ ...prev, searchDevice: value }));

                                            if (reason === 'input') {
                                                setSelectedBaseDevice(null);
                                                setCreateOrderForm((prev) => ({
                                                    ...prev,
                                                    deviceType: '',
                                                    deviceProducer: '',
                                                }));
                                            }
                                        }}
                                        onChange={(_, value) => {
                                            const pickedBaseDevice = typeof value === 'string' ? null : value;
                                            setSelectedBaseDevice(pickedBaseDevice);

                                            if (!pickedBaseDevice) {
                                                setCreateOrderForm((prev) => ({
                                                    ...prev,
                                                    searchDevice: baseDeviceInput,
                                                    deviceType: '',
                                                    deviceProducer: '',
                                                    deviceModel: '',
                                                }));
                                                return;
                                            }

                                            setBaseDeviceInput(formatBaseDeviceDisplay(pickedBaseDevice));
                                            setCreateOrderForm((prev) => ({
                                                ...prev,
                                                searchDevice: pickedBaseDevice.deviceModel ?? '',
                                                deviceType: pickedBaseDevice.deviceType ?? '',
                                                deviceProducer: pickedBaseDevice.producer ?? '',
                                                deviceModel: pickedBaseDevice.deviceModel ?? prev.deviceModel,
                                            }));
                                        }}
                                        noOptionsText={isClientSelected ? labels.NO_RESULTS : labels.SELECT_CLIENT_FIRST}
                                        sx={{ flex: 1, ...modalInputSx }}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option.id}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25 }}>
                                                    <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                                                        {option.deviceModel || '—'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                                        {option.deviceType || '—'} | {option.producer || '—'}
                                                    </Typography>
                                                </Box>
                                            </li>
                                        )}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder={labels.SEARCH_DEVICE}
                                                size="small"
                                                multiline={Boolean(selectedBaseDevice)}
                                                minRows={selectedBaseDevice ? 2 : undefined}
                                                sx={selectedBaseDevice
                                                    ? {
                                                        ...modalInputSx,
                                                        '& .MuiInputBase-root': {
                                                            ...modalInputSx['& .MuiInputBase-root'],
                                                            minHeight: { xs: 56, sm: 60 },
                                                            alignItems: 'flex-start',
                                                        },
                                                        '& .MuiInputBase-inputMultiline': {
                                                            fontSize: '0.83rem',
                                                            lineHeight: 1.2,
                                                            py: 0.7,
                                                            whiteSpace: 'pre-wrap',
                                                        },
                                                    }
                                                    : modalInputSx}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    readOnly: Boolean(selectedBaseDevice),
                                                    endAdornment: (
                                                        <>
                                                            {baseDevicesLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                            {params.InputProps?.endAdornment ?? null}
                                                        </>
                                                    ),
                                                }}
                                                inputProps={{
                                                    ...params.inputProps,
                                                    readOnly: Boolean(selectedBaseDevice),
                                                }}
                                            />
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="text"
                                        size="small"
                                        startIcon={<AddIcon fontSize="small" />}
                                        disabled={!isClientSelected}
                                        onClick={() => setShowCreateDeviceForm((prev) => !prev)}
                                        sx={{ textTransform: 'none', minWidth: 'auto', px: 0.5 }}
                                    >
                                        {labels.CREATE_BASE_DEVICE}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="text"
                                        color="error"
                                        size="small"
                                        startIcon={<DeleteIcon fontSize="small" />}
                                        disabled={!selectedBaseDevice?.id}
                                        onClick={handleDeleteSelectedBaseDevice}
                                        sx={{ textTransform: 'none', minWidth: 'auto', px: 0.5 }}
                                    >
                                        {labels.DELETE_BASE_DEVICE}
                                    </Button>
                                </Box>
                            </Box>

                            <Collapse in={showCreateDeviceForm}>
                                <Box sx={modalInnerBlueCardSx}>
                                    <Box sx={modalInnerBlueGridSx}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Autocomplete
                                                options={deviceTypeOptions}
                                                filterOptions={filterLookupOptions}
                                                value={deviceTypeOptions.find((item) => item.name === createOrderForm.deviceType) ?? null}
                                                onChange={(_, value) => setCreateOrderForm((p) => ({ ...p, deviceType: value?.name ?? '' }))}
                                                inputValue={deviceTypeInput}
                                                onInputChange={(_, value) => setDeviceTypeInput(value)}
                                                getOptionLabel={(option) => option?.name ?? ''}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                loading={deviceMetaLoading}
                                                disabled={!isClientSelected}
                                                noOptionsText={labels.NO_RESULTS}
                                                sx={{ flex: 1 }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={labels.DEVICE_TYPE}
                                                        size="small"
                                                        sx={{ ...modalInputSx, bgcolor: 'background.paper' }}
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    {deviceMetaLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                                    {params.InputProps?.endAdornment ?? null}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Autocomplete
                                                freeSolo
                                                options={producerOptions}
                                                filterOptions={filterLookupOptions}
                                                value={producerOptions.find((item) => item.name === createOrderForm.deviceProducer) ?? null}
                                                onChange={(_, value) => {
                                                    if (typeof value === 'string') {
                                                        setProducerInput(value);
                                                        setCreateOrderForm((p) => ({ ...p, deviceProducer: value }));
                                                        return;
                                                    }

                                                    setProducerInput(value?.name ?? '');
                                                    setCreateOrderForm((p) => ({ ...p, deviceProducer: value?.name ?? '' }));
                                                }}
                                                inputValue={producerInput}
                                                onInputChange={(_, value, reason) => {
                                                    if (reason === 'reset') return;

                                                    setProducerInput(value);
                                                    if (reason === 'input') {
                                                        setCreateOrderForm((p) => ({ ...p, deviceProducer: '' }));
                                                    }
                                                }}
                                                getOptionLabel={(option) => option?.name ?? ''}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                loading={deviceMetaLoading}
                                                disabled={!isClientSelected}
                                                noOptionsText={labels.NO_RESULTS}
                                                sx={{ flex: 1 }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={labels.DEVICE_PRODUCER}
                                                        size="small"
                                                        sx={{ ...modalInputSx, bgcolor: 'background.paper' }}
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    {deviceMetaLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                                    {params.InputProps?.endAdornment ?? null}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => handleCreateLookupValue('producer')}
                                                disabled={
                                                    !selectedCustomerId
                                                    || creatingLookupKey === 'producer'
                                                    || !producerInput.trim()
                                                    || normalizeText(createOrderForm.deviceProducer) === normalizeText(producerInput)
                                                }
                                                aria-label={labels.ADD_NEW_PRODUCER}
                                                sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
                                            >
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Autocomplete
                                                options={purposeOptions}
                                                filterOptions={filterLookupOptions}
                                                value={purposeOptions.find((item) => item.name === createOrderForm.devicePurpose) ?? null}
                                                onChange={(_, value) => setCreateOrderForm((p) => ({ ...p, devicePurpose: value?.name ?? '' }))}
                                                inputValue={purposeInput}
                                                onInputChange={(_, value) => setPurposeInput(value)}
                                                getOptionLabel={(option) => option?.name ?? ''}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                loading={deviceMetaLoading}
                                                disabled={!isClientSelected}
                                                noOptionsText={labels.NO_RESULTS}
                                                sx={{ flex: 1 }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={labels.DEVICE_PURPOSE}
                                                        size="small"
                                                        sx={{ ...modalInputSx, bgcolor: 'background.paper' }}
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    {deviceMetaLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                                    {params.InputProps?.endAdornment ?? null}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <TextField
                                                label={labels.DEVICE_MODEL}
                                                value={createOrderForm.deviceModel}
                                                onChange={setCreateField('deviceModel')}
                                                placeholder={labels.INPUT_PLACEHOLDER}
                                                size="small"
                                                disabled={!isClientSelected}
                                                inputProps={{ maxLength: 50 }}
                                                sx={{ ...modalInputSx, flex: 1, bgcolor: 'background.paper' }}
                                            />
                                        </Box>
                                    </Box>

                                    <Box sx={{ ...modalInnerActionsSx, mt: 2.1 }}>
                                        <Button variant="outlined" size="small" onClick={() => setShowCreateDeviceForm(false)}>
                                            {labels.CANCEL}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            disabled={
                                                !isClientSelected
                                                || isCreatingBaseDevice
                                                || !createOrderForm.deviceModel.trim()
                                                || !resolveLookupNumericId(deviceTypeOptions, createOrderForm.deviceType)
                                                || !resolveLookupNumericId(producerOptions, createOrderForm.deviceProducer)
                                            }
                                            onClick={handleCreateBaseDevice}
                                            startIcon={<AddIcon fontSize="small" />}
                                            sx={modalCreateClientDeviceButtonSx}
                                        >
                                            {labels.CREATE_BASE_DEVICE}
                                        </Button>
                                    </Box>
                                </Box>
                            </Collapse>

                            <Box sx={modalInnerActionsSx}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        setShowCreateClientDeviceForm(false);
                                        setShowCreateDeviceForm(false);
                                        setSelectedBaseDevice(null);
                                        setBaseDeviceInput('');
                                        setCreateOrderForm((prev) => ({
                                            ...prev,
                                            serialNumber: '',
                                            searchDevice: '',
                                            deviceType: '',
                                            deviceProducer: '',
                                            devicePurpose: '',
                                            deviceModel: '',
                                        }));
                                    }}
                                >
                                    {labels.CANCEL}
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    disabled={
                                        !isClientSelected
                                        || isCreatingCustomerDevice
                                        || !createOrderForm.serialNumber.trim()
                                        || !selectedBaseDevice?.id
                                    }
                                    onClick={handleCreateCustomerDevice}
                                    startIcon={<AddIcon fontSize="small" />}
                                    sx={modalCreateClientDeviceButtonSx}
                                >
                                    {selectedCustomerDeviceForAutocomplete?.id ? labels.SAVE_DEVICE_CHANGES : labels.CREATE_CLIENT_DEVICE}
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>

                    <OrderNoteFields
                        ref={noteFieldsRef}
                        labels={labels}
                        disabled={!isClientSelected}
                        resetToken={noteResetToken}
                        initialValues={noteInitialRef.current}
                        validationError={outerStateValidationError}
                        onOuterStateChange={handleOuterStateChange}
                    />

                    <Box sx={modalBottomActionsSx}>
                        <Button variant="outlined" onClick={onClose}>
                            {labels.CANCEL}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmitOrder}
                            disabled={isSubmittingOrder}
                        >
                            {labels.SUBMIT}
                        </Button>
                    </Box>
                </Stack>
            </DialogContent>
            </Dialog>

            {/* ── Confirm delete dialog ── */}
            <Dialog
                open={confirmDialog.open}
                onClose={closeConfirm}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {confirmDialog.message}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '0.9rem' }}>
                        {labels.CONFIRM_DELETE_BODY}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        size="small"
                        variant="text"
                        onClick={closeConfirm}
                        sx={{ color: 'text.secondary' }}
                    >
                        {labels.CANCEL}
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                            closeConfirm();
                            confirmDialog.onConfirm?.();
                        }}
                    >
                        {labels.DELETE_BTN}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={3500}
                onClose={closeNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={closeNotification} severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default CreateOrderModal;
