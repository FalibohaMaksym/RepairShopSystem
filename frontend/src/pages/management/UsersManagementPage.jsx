import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Divider,
    InputAdornment,
    Stack,
    Alert,
    CircularProgress,
    Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useLanguage } from '../../app/i18n/LanguageContext';
import { createUser, deleteUser, fetchBranches, fetchPositions, fetchRoles, fetchUsers, searchUsers, updateUser } from '../../services/usersService';
import { getApiErrorMessage } from '../../utils/apiError';

const INITIAL_CREATE_USER_FORM = {
    fullName: '',
    branchId: '',
    roleId: '',
    positionId: '',
    phoneNumber: '',
    email: '',
    password: '',
};

const validateEmail = (email) => {
    const trimmed = (email ?? '').trim();
    if (!trimmed) return '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed)
        ? ''
        : 'Невірний формат email';
};

const validatePhoneNumber = (phoneNumber) => {
    const trimmed = (phoneNumber ?? '').trim();
    if (!trimmed) return 'Телефон обов\'язковий';

    const normalized = trimmed.replace(/\D/g, '');
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(normalized)
        ? ''
        : 'Невірний формат телефону';
};

const normalizePhoneNumberForApi = (phoneNumber) => {
    const digits = String(phoneNumber ?? '').replace(/\D/g, '');
    if (!digits) return null;

    if (digits.length === 10) {
        return `+38${digits}`;
    }

    if (digits.length === 12 && digits.startsWith('380')) {
        return `+${digits}`;
    }

    return `+${digits}`;
};

const formatPhoneNumberInput = (rawValue) => {
    const rawDigits = String(rawValue ?? '').replace(/\D/g, '');
    const localDigits = rawDigits.startsWith('380') && rawDigits.length >= 12
        ? rawDigits.slice(2)
        : rawDigits;
    const digits = localDigits.slice(0, 10);
    if (!digits) return '';

    const area = digits.slice(0, 3);
    const firstPart = digits.slice(3, 6);
    const secondPart = digits.slice(6, 8);
    const thirdPart = digits.slice(8, 10);

    let formatted = '';
    if (area) {
        formatted += `(${area}`;
        if (area.length === 3) {
            formatted += ')';
        }
    }
    if (firstPart) {
        formatted += ` ${firstPart}`;
    }
    if (secondPart) {
        formatted += `-${secondPart}`;
    }
    if (thirdPart) {
        formatted += `-${thirdPart}`;
    }

    return formatted;
};

const UsersManagementPage = () => {
    const { labels, lang } = useLanguage();
    const navigation = labels.navigation;

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [positions, setPositions] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranchAddresses, setSelectedBranchAddresses] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingMeta, setLoadingMeta] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isBranchFilterInitialized, setIsBranchFilterInitialized] = useState(false);
    const [isRoleFilterInitialized, setIsRoleFilterInitialized] = useState(false);
    const [createUserPanelOpen, setCreateUserPanelOpen] = useState(false);
    const [createUserForm, setCreateUserForm] = useState(INITIAL_CREATE_USER_FORM);
    const [createUserSubmitting, setCreateUserSubmitting] = useState(false);
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editUserSubmitting, setEditUserSubmitting] = useState(false);
    const [deleteUserSubmittingId, setDeleteUserSubmittingId] = useState(null);
    const [editUserForm, setEditUserForm] = useState(null);
    const [editUserFieldErrors, setEditUserFieldErrors] = useState({
        email: '',
        phoneNumber: '',
    });
    const [createUserFieldErrors, setCreateUserFieldErrors] = useState({
        email: '',
        phoneNumber: '',
    });

    const branchAddressOptions = useMemo(
        () => branches.map((item) => item.address).filter(Boolean),
        [branches]
    );

    const roleOptions = useMemo(
        () => roles.map((item) => item.name).filter(Boolean),
        [roles]
    );

    const visibleUsers = useMemo(() => {
        return users.filter((user) => {
            const branchMatch = selectedBranchAddresses.length === 0 || selectedBranchAddresses.includes(user.branchAddress);
            const roleMatch = selectedRoles.length === 0 || selectedRoles.includes(user.roleName);
            return branchMatch && roleMatch;
        });
    }, [selectedBranchAddresses, selectedRoles, users]);

    useEffect(() => {
        let isActive = true;

        const loadMeta = async () => {
            setLoadingMeta(true);
            setErrorMessage('');

            try {
                const [rolesData, positionsData, branchesData] = await Promise.all([
                    fetchRoles(),
                    fetchPositions(),
                    fetchBranches(),
                ]);

                if (!isActive) return;
                setRoles(rolesData);
                setPositions(positionsData);
                setBranches(branchesData);
            } catch {
                if (!isActive) return;
                setErrorMessage(lang === 'ua' ? 'Не вдалося завантажити довідники.' : 'Failed to load reference data.');
            } finally {
                if (isActive) {
                    setLoadingMeta(false);
                }
            }
        };

        loadMeta();

        return () => {
            isActive = false;
        };
    }, [lang]);

    useEffect(() => {
        if (!isBranchFilterInitialized && branchAddressOptions.length > 0) {
            setSelectedBranchAddresses(branchAddressOptions);
            setIsBranchFilterInitialized(true);
        }
    }, [branchAddressOptions, isBranchFilterInitialized]);

    useEffect(() => {
        if (!isRoleFilterInitialized && roleOptions.length > 0) {
            setSelectedRoles(roleOptions);
            setIsRoleFilterInitialized(true);
        }
    }, [isRoleFilterInitialized, roleOptions]);

    useEffect(() => {
        let isActive = true;

        const run = async () => {
            setLoadingUsers(true);
            setErrorMessage('');

            try {
                const trimmed = searchQuery.trim();
                const usersData = trimmed ? await searchUsers(trimmed) : await fetchUsers();

                if (!isActive) return;
                setUsers(usersData);
            } catch {
                if (!isActive) return;
                setErrorMessage(lang === 'ua' ? 'Не вдалося завантажити користувачів.' : 'Failed to load users.');
                setUsers([]);
            } finally {
                if (isActive) {
                    setLoadingUsers(false);
                }
            }
        };

        const timeoutId = window.setTimeout(run, 300);

        return () => {
            isActive = false;
            window.clearTimeout(timeoutId);
        };
    }, [lang, searchQuery]);

    const highlightedUser = visibleUsers.find((user) => user.id === expandedUserId) ?? visibleUsers[0] ?? null;

    const handleCreateUserFieldChange = (fieldName) => (event) => {
        const rawValue = event.target.value;
        const nextValue = fieldName === 'phoneNumber'
            ? formatPhoneNumberInput(rawValue)
            : rawValue;
        setCreateUserForm((prev) => ({
            ...prev,
            [fieldName]: nextValue,
        }));

        if (fieldName === 'email') {
            setCreateUserFieldErrors((prev) => ({
                ...prev,
                email: validateEmail(nextValue),
            }));
        }

        if (fieldName === 'phoneNumber') {
            setCreateUserFieldErrors((prev) => ({
                ...prev,
                phoneNumber: validatePhoneNumber(nextValue),
            }));
        }
    };

    const handleCreateUserSubmit = async () => {
        const trimmedFullName = createUserForm.fullName.trim();
        const trimmedPassword = createUserForm.password.trim();
        const nextFieldErrors = {
            email: validateEmail(createUserForm.email),
            phoneNumber: validatePhoneNumber(createUserForm.phoneNumber),
        };

        setCreateUserFieldErrors(nextFieldErrors);

        if (nextFieldErrors.email || nextFieldErrors.phoneNumber) {
            return;
        }

        if (!trimmedFullName || !createUserForm.branchId || !createUserForm.roleId || !trimmedPassword) {
            setErrorMessage(lang === 'ua'
                ? 'Заповніть обов\'язкові поля: ПІБ, Відділення, Роль, Телефон, Пароль.'
                : 'Fill required fields: Full name, Branch, Role, Phone, Password.');
            return;
        }

        setCreateUserSubmitting(true);
        setErrorMessage('');

        try {
            const payload = {
                fullName: trimmedFullName,
                phoneNumber: normalizePhoneNumberForApi(createUserForm.phoneNumber),
                email: createUserForm.email.trim() || null,
                positionId: createUserForm.positionId ? Number(createUserForm.positionId) : null,
                branchId: Number(createUserForm.branchId),
                password: trimmedPassword,
                roleId: Number(createUserForm.roleId),
            };

            await createUser(payload);
            setCreateUserPanelOpen(false);
            setCreateUserForm(INITIAL_CREATE_USER_FORM);
            setCreateUserFieldErrors({ email: '', phoneNumber: '' });

            const usersData = await fetchUsers();
            setUsers(usersData);
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, lang === 'ua' ? 'Не вдалося створити користувача.' : 'Failed to create user.', lang === 'ua' ? 'ua' : 'en'));
        } finally {
            setCreateUserSubmitting(false);
        }
    };

    const startEditingUser = (user) => {
        const mappedRoleId = user.roleId ?? roles.find((item) => item.name === user.roleName)?.id ?? '';
        const mappedPositionId = positions.find((item) => item.name === user.positionName)?.id ?? '';

        setEditingUserId(user.id);
        setEditUserForm({
            fullName: user.workerFullName ?? '',
            email: user.workerEmail ?? '',
            phoneNumber: formatPhoneNumberInput(user.workerPhoneNumber ?? ''),
            roleId: mappedRoleId ? String(mappedRoleId) : '',
            branchId: user.branchId ? String(user.branchId) : '',
            positionId: mappedPositionId ? String(mappedPositionId) : '',
            password: '',
        });
        setEditUserFieldErrors({ email: '', phoneNumber: '' });
    };

    const handleEditUserFieldChange = (fieldName) => (event) => {
        const rawValue = event.target.value;
        const nextValue = fieldName === 'phoneNumber'
            ? formatPhoneNumberInput(rawValue)
            : rawValue;

        setEditUserForm((prev) => ({
            ...(prev || {}),
            [fieldName]: nextValue,
        }));

        if (fieldName === 'email') {
            setEditUserFieldErrors((prev) => ({
                ...prev,
                email: validateEmail(nextValue),
            }));
        }

        if (fieldName === 'phoneNumber') {
            setEditUserFieldErrors((prev) => ({
                ...prev,
                phoneNumber: validatePhoneNumber(nextValue),
            }));
        }
    };

    const cancelEditingUser = () => {
        setEditingUserId(null);
        setEditUserForm(null);
        setEditUserFieldErrors({ email: '', phoneNumber: '' });
    };

    const handleConfirmEditUser = async () => {
        if (!editingUserId || !editUserForm) return;

        const trimmedFullName = editUserForm.fullName?.trim() || '';
        const nextFieldErrors = {
            email: validateEmail(editUserForm.email),
            phoneNumber: validatePhoneNumber(editUserForm.phoneNumber),
        };

        setEditUserFieldErrors(nextFieldErrors);
        if (nextFieldErrors.email || nextFieldErrors.phoneNumber) return;

        if (!trimmedFullName || !editUserForm.branchId || !editUserForm.roleId) {
            setErrorMessage(lang === 'ua'
                ? 'Заповніть обов\'язкові поля редагування: ПІБ, Відділення, Роль, Телефон.'
                : 'Fill required edit fields: Full name, Branch, Role, Phone.');
            return;
        }

        setEditUserSubmitting(true);
        setErrorMessage('');

        try {
            const trimmedPassword = (editUserForm.password || '').trim();
            const payload = {
                fullName: trimmedFullName,
                phoneNumber: normalizePhoneNumberForApi(editUserForm.phoneNumber),
                email: (editUserForm.email || '').trim() || null,
                positionId: editUserForm.positionId ? Number(editUserForm.positionId) : null,
                branchId: Number(editUserForm.branchId),
                roleId: Number(editUserForm.roleId),
                ...(trimmedPassword ? { password: trimmedPassword } : {}),
            };

            await updateUser(editingUserId, payload);
            const usersData = await fetchUsers();
            setUsers(usersData);
            cancelEditingUser();
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, lang === 'ua' ? 'Не вдалося оновити користувача.' : 'Failed to update user.', lang === 'ua' ? 'ua' : 'en'));
        } finally {
            setEditUserSubmitting(false);
        }
    };

    const handleDeleteUser = async (user) => {
        const confirmed = window.confirm(
            lang === 'ua'
                ? `Видалити користувача "${user.workerFullName}"?`
                : `Delete user "${user.workerFullName}"?`
        );

        if (!confirmed) return;

        setDeleteUserSubmittingId(user.id);
        setErrorMessage('');

        try {
            await deleteUser(user.id);
            const usersData = await fetchUsers();
            setUsers(usersData);

            if (expandedUserId === user.id) {
                setExpandedUserId(null);
            }

            if (editingUserId === user.id) {
                cancelEditingUser();
            }
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, lang === 'ua' ? 'Не вдалося видалити користувача.' : 'Failed to delete user.', lang === 'ua' ? 'ua' : 'en'));
        } finally {
            setDeleteUserSubmittingId(null);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography component="h1" variant="h4" fontWeight={600} sx={{ mb: 2.5, color: 'text.primary' }}>
                {navigation.MANAGEMENT_USERS}
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        lg: filtersOpen ? 'minmax(0, 1fr) 320px' : 'minmax(0, 1fr)',
                    },
                    gap: 2,
                    alignItems: 'start',
                }}
            >
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            mb: 2,
                            flexWrap: 'wrap',
                        }}
                    >
                        <TextField
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Пошук..."
                            size="small"
                            sx={{ flex: 1, minWidth: 280, bgcolor: 'background.paper' }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <SearchIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant={filtersOpen ? 'contained' : 'outlined'}
                            startIcon={<FilterListIcon />}
                            onClick={() => setFiltersOpen((prev) => !prev)}
                            sx={{ minWidth: 44, px: 1.25, py: 1 }}
                            aria-label={lang === 'ua' ? 'Фільтри' : 'Filters'}
                        />
                        <Button
                            variant="contained"
                            sx={{ px: 3, py: 1 }}
                            onClick={() => {
                                setCreateUserPanelOpen((prev) => !prev);
                                setErrorMessage('');
                            }}
                        >
                            {createUserPanelOpen
                                ? (lang === 'ua' ? 'Закрити форму' : 'Close form')
                                : (lang === 'ua' ? 'Створити Користувача' : 'Create User')}
                        </Button>
                    </Box>

                    {errorMessage && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMessage}
                        </Alert>
                    )}

                    {(loadingMeta || loadingUsers) && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <CircularProgress size={28} />
                        </Box>
                    )}

                    <Collapse in={createUserPanelOpen} timeout={220} unmountOnExit>
                        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'center' }, mb: 2.2 }}>
                            <Paper
                                sx={{
                                    p: 1.5,
                                    width: { xs: '100%', md: 'fit-content' },
                                    maxWidth: '100%',
                                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(184,116,206,0.1)' : '#EBDCF1',
                                    border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(184,116,206,0.2)' : '1px solid #d9c4e4',
                                    boxShadow: '0px 2px 8px rgba(0,0,0,0.16)',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: { xs: '100%', md: 'fit-content' },
                                        maxWidth: '100%',
                                        mx: 'auto',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: {
                                                xs: '1fr',
                                                md: 'minmax(260px, 320px) minmax(260px, 320px)',
                                            },
                                            gap: 1.3,
                                            mb: 1,
                                        }}
                                    >
                                        <TextField
                                            label={lang === 'ua' ? "Повне Ім'я" : 'Full Name'}
                                            size="small"
                                            required
                                            placeholder={lang === 'ua' ? 'Введіть ПІБ...' : 'Enter full name...'}
                                            helperText={lang === 'ua' ? 'Підтримується текст' : 'Text is supported'}
                                            value={createUserForm.fullName}
                                            onChange={handleCreateUserFieldChange('fullName')}
                                            inputProps={{ maxLength: 70 }}
                                        />
                                        <TextField
                                            label={lang === 'ua' ? 'Відділення' : 'Branch'}
                                            size="small"
                                            required
                                            select
                                            value={createUserForm.branchId}
                                            onChange={handleCreateUserFieldChange('branchId')}
                                            disabled={loadingMeta || branches.length === 0}
                                        >
                                            <MenuItem value="">{lang === 'ua' ? 'Виберіть відділення' : 'Select a branch'}</MenuItem>
                                            {branches.map((branch) => (
                                                <MenuItem key={branch.id} value={branch.id}>
                                                    {branch.address}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: {
                                                xs: '1fr',
                                                md: 'minmax(220px, 280px) minmax(200px, 260px) minmax(260px, 320px)',
                                            },
                                            gap: 1.3,
                                            mb: 1,
                                        }}
                                    >
                                        <TextField
                                            label={lang === 'ua' ? 'Роль користувача' : 'User role'}
                                            size="small"
                                            required
                                            select
                                            helperText=" "
                                            value={createUserForm.roleId}
                                            onChange={handleCreateUserFieldChange('roleId')}
                                            disabled={loadingMeta || roles.length === 0}
                                        >
                                            <MenuItem value="">{lang === 'ua' ? 'Роль користувача' : 'User role'}</MenuItem>
                                            {roles.map((role) => (
                                                <MenuItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            label={lang === 'ua' ? 'Посада' : 'Position'}
                                            size="small"
                                            select
                                            helperText=" "
                                            value={createUserForm.positionId}
                                            onChange={handleCreateUserFieldChange('positionId')}
                                            disabled={loadingMeta || positions.length === 0}
                                        >
                                            <MenuItem value="">{lang === 'ua' ? 'Посада' : 'Position'}</MenuItem>
                                            {positions.map((position) => (
                                                <MenuItem key={position.id} value={position.id}>
                                                    {position.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            label={lang === 'ua' ? 'Номер телефону' : 'Phone number'}
                                            size="small"
                                            required
                                            placeholder="(_ _ _) _ _ _-_ _-_ _"
                                            helperText={createUserFieldErrors.phoneNumber || (lang === 'ua' ? 'Формат: (XXX) XXX-XX-XX' : 'Format: (XXX) XXX-XX-XX')}
                                            error={Boolean(createUserFieldErrors.phoneNumber)}
                                            value={createUserForm.phoneNumber}
                                            onChange={handleCreateUserFieldChange('phoneNumber')}
                                        />
                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: {
                                                xs: '1fr',
                                                md: 'minmax(260px, 320px) minmax(260px, 320px)',
                                            },
                                            gap: 1.3,
                                            mb: 1.6,
                                        }}
                                    >
                                        <TextField
                                            label={lang === 'ua' ? 'Email Працівника' : 'Worker Email'}
                                            size="small"
                                            placeholder={lang === 'ua' ? 'Введіть Email' : 'Enter Email'}
                                            helperText={createUserFieldErrors.email || (lang === 'ua' ? 'Підтримується текст' : 'Text is supported')}
                                            error={Boolean(createUserFieldErrors.email)}
                                            value={createUserForm.email}
                                            onChange={handleCreateUserFieldChange('email')}
                                            inputProps={{ maxLength: 70 }}
                                        />
                                        <TextField
                                            label={lang === 'ua' ? 'Пароль' : 'Password'}
                                            size="small"
                                            required
                                            type="password"
                                            helperText={lang === 'ua' ? 'Підтримується текст' : 'Text is supported'}
                                            value={createUserForm.password}
                                            onChange={handleCreateUserFieldChange('password')}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.6 }}>
                                        <Button
                                            variant="outlined"
                                            sx={{ px: 4 }}
                                            onClick={() => {
                                                setCreateUserPanelOpen(false);
                                                setCreateUserForm(INITIAL_CREATE_USER_FORM);
                                                setCreateUserFieldErrors({ email: '', phoneNumber: '' });
                                            }}
                                        >
                                            {lang === 'ua' ? 'Відмінити' : 'Cancel'}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            sx={{ px: 4 }}
                                            onClick={handleCreateUserSubmit}
                                            disabled={createUserSubmitting}
                                        >
                                            {lang === 'ua' ? 'Підтвердити' : 'Confirm'}
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        </Box>
                    </Collapse>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(220px, 1fr))',
                                lg: filtersOpen ? 'repeat(2, minmax(220px, 1fr))' : 'repeat(3, minmax(220px, 1fr))',
                                xl: filtersOpen ? 'repeat(2, minmax(240px, 1fr))' : 'repeat(3, minmax(260px, 1fr))',
                            },
                            justifyContent: 'stretch',
                            alignItems: 'start',
                            gap: 2,
                            mb: 2,
                        }}
                    >
                        {visibleUsers.map((user) => {
                            const isExpanded = expandedUserId === user.id;

                            return (
                            <Paper
                                key={user.id}
                                onDoubleClick={() => {
                                    setExpandedUserId((prev) => {
                                        const nextExpanded = prev === user.id ? null : user.id;
                                        if (nextExpanded !== user.id) {
                                            setEditingUserId((editingPrev) => (editingPrev === user.id ? null : editingPrev));
                                        }
                                        return nextExpanded;
                                    });
                                }}
                                sx={{
                                    p: 1.4,
                                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.15)' : '#D5E5F2',
                                    border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(100, 170, 235, 0.4)' : '1px solid #c1d5e6',
                                    boxShadow: '0px 2px 8px rgba(0,0,0,0.16)',
                                    cursor: 'pointer',
                                    gridColumn: {
                                        xs: 'auto',
                                        md: isExpanded ? 'span 2' : 'span 1',
                                        lg: isExpanded ? (filtersOpen ? 'span 2' : 'span 3') : 'span 1',
                                    },
                                    transition: 'grid-column 180ms ease, box-shadow 180ms ease',
                                }}
                            >
                                <Typography><b>{lang === 'ua' ? "Ім'я" : 'Name'}:</b> {user.workerFullName}</Typography>
                                <Typography><b>{lang === 'ua' ? 'Роль' : 'Role'}:</b> {user.roleName}</Typography>
                                <Typography><b>{lang === 'ua' ? 'Номер телефону' : 'Phone'}:</b> {user.workerPhoneNumber}</Typography>
                                <Typography><b>Email:</b> {user.workerEmail}</Typography>

                                <Collapse in={isExpanded} timeout={200} unmountOnExit>
                                    <Box sx={{ mt: 1.2 }}>
                                        <Divider sx={{ mb: 1.2 }} />
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: {
                                                    xs: '1fr',
                                                    xl: 'minmax(0, 1fr) 210px',
                                                },
                                                gap: 1.2,
                                                alignItems: 'start',
                                            }}
                                        >
                                            <Box>
                                                {editingUserId === user.id && (
                                                    <Box
                                                        sx={{
                                                            display: 'grid',
                                                            gridTemplateColumns: {
                                                                xs: '1fr',
                                                                md: '1fr 1fr',
                                                                xl: 'repeat(3, minmax(220px, 1fr))',
                                                            },
                                                            gap: 1.2,
                                                        }}
                                                    >
                                                        <TextField
                                                            label={lang === 'ua' ? "Ім'я" : 'Name'}
                                                            size="small"
                                                            value={editUserForm?.fullName ?? ''}
                                                            onChange={handleEditUserFieldChange('fullName')}
                                                            inputProps={{ maxLength: 70 }}
                                                        />
                                                        <TextField
                                                            label="Email"
                                                            size="small"
                                                            type="email"
                                                            value={editUserForm?.email ?? ''}
                                                            onChange={handleEditUserFieldChange('email')}
                                                            helperText={editUserFieldErrors.email || ' '}
                                                            error={Boolean(editUserFieldErrors.email)}
                                                            inputProps={{ maxLength: 70 }}
                                                        />
                                                        <TextField
                                                            label={lang === 'ua' ? 'Номер телефону' : 'Phone'}
                                                            size="small"
                                                            value={editUserForm?.phoneNumber ?? ''}
                                                            onChange={handleEditUserFieldChange('phoneNumber')}
                                                            helperText={editUserFieldErrors.phoneNumber || ' '}
                                                            error={Boolean(editUserFieldErrors.phoneNumber)}
                                                        />
                                                        <TextField
                                                            label={lang === 'ua' ? 'Відділення' : 'Branch'}
                                                            size="small"
                                                            select
                                                            value={editUserForm?.branchId ?? ''}
                                                            onChange={handleEditUserFieldChange('branchId')}
                                                            disabled={loadingMeta || branches.length === 0}
                                                        >
                                                            <MenuItem value="">{lang === 'ua' ? 'Виберіть відділення' : 'Select branch'}</MenuItem>
                                                            {branches.map((branch) => (
                                                                <MenuItem key={branch.id} value={String(branch.id)}>
                                                                    {branch.address}
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                        <TextField
                                                            label={lang === 'ua' ? 'Посада' : 'Position'}
                                                            size="small"
                                                            select
                                                            value={editUserForm?.positionId ?? ''}
                                                            onChange={handleEditUserFieldChange('positionId')}
                                                            disabled={loadingMeta || positions.length === 0}
                                                        >
                                                            <MenuItem value="">{lang === 'ua' ? 'Без посади' : 'No position'}</MenuItem>
                                                            {positions.map((position) => (
                                                                <MenuItem key={position.id} value={String(position.id)}>
                                                                    {position.name}
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                        <TextField
                                                            label={lang === 'ua' ? 'Роль користувача' : 'User role'}
                                                            size="small"
                                                            select
                                                            value={editUserForm?.roleId ?? ''}
                                                            onChange={handleEditUserFieldChange('roleId')}
                                                            disabled={loadingMeta || roles.length === 0}
                                                        >
                                                            <MenuItem value="">{lang === 'ua' ? 'Виберіть роль' : 'Select role'}</MenuItem>
                                                            {roles.map((role) => (
                                                                <MenuItem key={role.id} value={String(role.id)}>{role.name}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                        <TextField
                                                            label={lang === 'ua' ? 'Новий пароль' : 'New password'}
                                                            size="small"
                                                            type="password"
                                                            value={editUserForm?.password ?? ''}
                                                            onChange={handleEditUserFieldChange('password')}
                                                            helperText={lang === 'ua' ? 'Залиште порожнім, щоб не змінювати' : 'Leave empty to keep current password'}
                                                        />
                                                    </Box>
                                                )}
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: { xs: 'row', xl: 'column' },
                                                    justifyContent: 'flex-start',
                                                    gap: 1.2,
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    onClick={() => startEditingUser(user)}
                                                    disabled={deleteUserSubmittingId === user.id}
                                                >
                                                    {lang === 'ua' ? 'Редагувати' : 'Edit'}
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    onClick={() => handleDeleteUser(user)}
                                                    disabled={deleteUserSubmittingId === user.id}
                                                >
                                                    {lang === 'ua' ? 'Видалити' : 'Delete'}
                                                </Button>
                                            </Box>
                                        </Box>

                                        {editingUserId === user.id && (
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.2, mt: 1.2, flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="outlined"
                                                    onClick={cancelEditingUser}
                                                >
                                                    {lang === 'ua' ? 'Скасувати редагування' : 'Cancel editing'}
                                                </Button>
                                                <Button variant="contained" onClick={handleConfirmEditUser} disabled={editUserSubmitting}>
                                                    {lang === 'ua' ? 'Підтвердити редагування' : 'Confirm editing'}
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                </Collapse>
                            </Paper>
                            );
                        })}
                    </Box>

                    {!loadingUsers && visibleUsers.length === 0 && (
                        <Paper
                            sx={{
                                p: 2,
                                mb: 2,
                                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f7fa',
                                border: (t) => t.palette.mode === 'dark' ? '1px dashed rgba(255,255,255,0.2)' : '1px dashed #c4ccd5',
                            }}
                        >
                            <Typography color="text.secondary" textAlign="center">
                                {lang === 'ua' ? 'Користувачів не знайдено' : 'No users found'}
                            </Typography>
                        </Paper>
                    )}

                </Box>

                {filtersOpen && (
                    <Stack spacing={2} sx={{ width: '100%' }}>
                        <Paper
                            sx={{
                                p: 1.2,
                                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.15)' : '#D5E5F2',
                                border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(100, 170, 235, 0.4)' : '1px solid #c1d5e6',
                                boxShadow: '0px 2px 8px rgba(0,0,0,0.16)',
                            }}
                        >
                            <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
                                {lang === 'ua' ? 'Фільтри' : 'Filters'}
                            </Typography>
                            <Paper sx={{ p: 1.2, borderRadius: 1, mb: 1.2 }}>
                                <Typography sx={{ textAlign: 'center', fontWeight: 600, mb: 0.5 }}>
                                    {lang === 'ua' ? 'Роль' : 'Role'}
                                </Typography>
                                <Divider sx={{ mb: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Button size="small" onClick={() => setSelectedRoles(roleOptions)} sx={{ fontSize: '0.7rem', textTransform: 'none', px: 0.5, minWidth: 'auto' }}>
                                        {lang === 'ua' ? 'Обрати всі' : 'Select all'}
                                    </Button>
                                    <Button size="small" color="error" onClick={() => setSelectedRoles([])} sx={{ fontSize: '0.7rem', textTransform: 'none', px: 0.5, minWidth: 'auto' }}>
                                        {lang === 'ua' ? 'Скинути' : 'Clear'}
                                    </Button>
                                </Box>
                                <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                                    {roleOptions.map((item) => (
                                        <FormControlLabel
                                            key={item}
                                            sx={{ display: 'flex', mb: 0, ml: 0 }}
                                            control={(
                                                <Checkbox
                                                    size="small"
                                                    sx={{ py: 0.5 }}
                                                    checked={selectedRoles.includes(item)}
                                                    onChange={(event) => {
                                                        if (event.target.checked) {
                                                            setSelectedRoles((prev) => [...prev, item]);
                                                        } else {
                                                            setSelectedRoles((prev) => prev.filter((roleName) => roleName !== item));
                                                        }
                                                    }}
                                                />
                                            )}
                                            label={<Typography variant="body2">{item}</Typography>}
                                        />
                                    ))}
                                </Box>
                            </Paper>

                            <Paper sx={{ p: 1.2, borderRadius: 1 }}>
                                <Typography sx={{ textAlign: 'center', fontWeight: 600, mb: 0.5 }}>
                                    {lang === 'ua' ? 'Відділення' : 'Branch offices'}
                                </Typography>
                                <Divider sx={{ mb: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Button size="small" onClick={() => setSelectedBranchAddresses(branchAddressOptions)} sx={{ fontSize: '0.7rem', textTransform: 'none', px: 0.5, minWidth: 'auto' }}>
                                        {lang === 'ua' ? 'Обрати всі' : 'Select all'}
                                    </Button>
                                    <Button size="small" color="error" onClick={() => setSelectedBranchAddresses([])} sx={{ fontSize: '0.7rem', textTransform: 'none', px: 0.5, minWidth: 'auto' }}>
                                        {lang === 'ua' ? 'Скинути' : 'Clear'}
                                    </Button>
                                </Box>
                                <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                                    {branchAddressOptions.map((item) => (
                                        <FormControlLabel
                                            key={item}
                                            sx={{ mb: 0.5, alignItems: 'flex-start', width: '100%', ml: 0 }}
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    sx={{ py: 0.2 }}
                                                    checked={selectedBranchAddresses.includes(item)}
                                                    onChange={(event) => {
                                                        if (event.target.checked) {
                                                            setSelectedBranchAddresses((prev) => [...prev, item]);
                                                        } else {
                                                            setSelectedBranchAddresses((prev) => prev.filter((address) => address !== item));
                                                        }
                                                    }}
                                                />
                                            }
                                            label={
                                                <Typography variant="body2" sx={{ lineHeight: 1.2, mt: 0.5 }}>
                                                    {item}
                                                </Typography>
                                            }
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        </Paper>

                        <Paper
                            sx={{
                                p: 1.4,
                                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(100, 170, 235, 0.15)' : '#D5E5F2',
                                border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(100, 170, 235, 0.4)' : '1px solid #c1d5e6',
                                boxShadow: '0px 2px 8px rgba(0,0,0,0.16)',
                            }}
                        >
                            <Typography><b>{lang === 'ua' ? "Ім'я" : 'Name'}:</b> {highlightedUser?.workerFullName ?? '—'}</Typography>
                            <Typography><b>{lang === 'ua' ? 'Роль' : 'Role'}:</b> {highlightedUser?.roleName ?? '—'}</Typography>
                            <Typography><b>{lang === 'ua' ? 'Номер телефону' : 'Phone'}:</b> {highlightedUser?.workerPhoneNumber ?? '—'}</Typography>
                            <Typography><b>Email:</b> {highlightedUser?.workerEmail ?? '—'}</Typography>
                        </Paper>
                    </Stack>
                )}
            </Box>
        </Box>
    );
};

export default UsersManagementPage;
