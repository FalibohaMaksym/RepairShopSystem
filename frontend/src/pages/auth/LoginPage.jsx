import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    CircularProgress,
    ToggleButtonGroup,
    ToggleButton,
    Snackbar,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/auth/AuthContext';
import { useLanguage } from '../../app/i18n/LanguageContext';
import AuthService from '../../app/auth/AuthService';
import { normalizeRole, getDefaultRouteForRole } from '../../app/auth/roleUtils';
import GoogleIcon from '@mui/icons-material/Google';

/**
 * Pixel-perfect responsive LoginPage based on Figma design.
 */
const LoginPage = () => {
    const { labels, lang, setLang } = useLanguage();
    const AUTH_LABELS = labels.auth;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleLanguageChange = (event, newLang) => {
        if (newLang !== null) {
            setLang(newLang);
        }
    };

    const validateIdentifier = (value) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phoneRegex = /^\+?[0-9]{7,15}$/; // Simple check for digits
        return emailRegex.test(value) || phoneRegex.test(value);
    };

    /**
     * Before redirecting to the backend OAuth endpoint, perform a lightweight
     * health-check fetch. Any HTTP response (including 401/403) means the server
     * is reachable. A network-level failure (ERR_CONNECTION_REFUSED, timeout)
     * means the server is down — we show a Snackbar instead of letting the
     * browser display its native "This page isn’t working" error.
     */
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const res = await fetch('/api/auth/me', { signal: AbortSignal.timeout(3000) });
            // 5xx = proxy/gateway error, which means the backend is not reachable.
            // 2xx and 4xx (e.g. 401 Unauthorized) confirm the server is up.
            if (res.status >= 500) {
                throw new Error(`Backend unavailable (HTTP ${res.status})`);
            }
        } catch {
            // Network error, timeout, or 5xx HTTP status — backend is down
            setSnackbarMsg(AUTH_LABELS.ERROR_BACKEND_UNAVAILABLE);
            setSnackbarOpen(true);
            setGoogleLoading(false);
            return;
        }
        // Server responded with 2xx or 4xx — it is up, proceed with OAuth
        window.location.href = '/oauth2/authorization/google';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedUsername = username.trim();

        // Field-level validation — показуємо кастомні помилки замість нативного браузерного тултипу
        let hasFieldError = false;
        if (!trimmedUsername) {
            setUsernameError(AUTH_LABELS.ERROR_EMPTY_USERNAME);
            hasFieldError = true;
        } else {
            setUsernameError('');
        }
        if (!password) {
            setPasswordError(AUTH_LABELS.ERROR_EMPTY_PASSWORD);
            hasFieldError = true;
        } else {
            setPasswordError('');
        }
        if (hasFieldError) return;

        if (!validateIdentifier(trimmedUsername)) {
            setError('FORMAT');
            return;
        }

        setLoading(true);
        try {
            setError('');
            await login(trimmedUsername, password);
            const role = normalizeRole(AuthService.getRole());
            navigate(getDefaultRouteForRole(role));
        } catch (err) {
            const status = err.response?.status;
            const isBackendUnavailable =
                !err.response ||
                err.code === 'ERR_NETWORK' ||
                err.code === 'ECONNABORTED' ||
                status === 502 ||
                status === 503 ||
                status === 504;

            if (status === 401) {
                setError('401');
            } else if (isBackendUnavailable) {
                setError('BACKEND_UNAVAILABLE');
            } else {
                setError(err.response?.data?.error || 'ERROR');
            }
        } finally {
            setLoading(false);
        }
    };

    const getErrorMessage = () => {
        if (!error) return '';
        if (error === '401') return AUTH_LABELS.ERROR_INVALID_CREDENTIALS;
        if (error === 'FORMAT') return AUTH_LABELS.ERROR_INVALID_FORMAT;
        if (error === 'BACKEND_UNAVAILABLE') return AUTH_LABELS.ERROR_BACKEND_UNAVAILABLE;
        if (error === 'ERROR') return AUTH_LABELS.ERROR_MESSAGE;
        return error; // Return literal string if it's from backend
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: { xs: 2, sm: 4 }
            }}
        >
            <Container component="main" sx={{ p: 0, maxWidth: '480px !important' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
                        position: 'relative'
                    }}
                >
                    <Box sx={{ alignSelf: 'flex-end', mb: 2 }}>
                        <ToggleButtonGroup
                            value={lang}
                            exclusive
                            onChange={handleLanguageChange}
                            size="small"
                            aria-label="language switcher"
                        >
                            <ToggleButton value="ua" sx={{ px: 2, fontSize: '0.75rem' }}>UA</ToggleButton>
                            <ToggleButton value="en" sx={{ px: 2, fontSize: '0.75rem' }}>EN</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <Typography
                        component="h1"
                        variant="h3"
                        sx={{
                            mb: 0.5,
                            textAlign: 'center',
                            fontSize: { xs: '32px', sm: '45px' },
                            color: 'text.primary'
                        }}
                    >
                        {AUTH_LABELS.TITLE}
                    </Typography>
                    <Typography
                        component="h2"
                        variant="h4"
                        sx={{
                            mb: 4,
                            textAlign: 'center',
                            fontSize: { xs: '28px', sm: '36px' },
                            color: 'text.primary'
                        }}
                    >
                        {AUTH_LABELS.SUBTITLE}
                    </Typography>

                    {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{getErrorMessage()}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                        <Box sx={{ mb: 2.5 }}>
                            <TextField
                                variant="outlined"
                                margin="none"
                                fullWidth
                                id="username"
                                label={AUTH_LABELS.EMAIL_LABEL}
                                placeholder={AUTH_LABELS.EMAIL_PLACEHOLDER}
                                name="username"
                                autoComplete="email"
                                autoFocus
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); if (usernameError) setUsernameError(''); }}
                                disabled={loading}
                                error={!!usernameError}
                                helperText={usernameError || AUTH_LABELS.HELPER_TEXT}
                                sx={{
                                    '& .MuiFormHelperText-root': { ml: 0, mt: 0.5 },
                                    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
                                        WebkitBoxShadow: (t) => `0 0 0 100px ${t.palette.background.paper} inset`,
                                        WebkitTextFillColor: (t) => t.palette.text.primary,
                                        caretColor: (t) => t.palette.text.primary,
                                        transition: 'background-color 9999s ease-in-out 0s',
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ mb: 1.5 }}>
                            <TextField
                                variant="outlined"
                                margin="none"
                                fullWidth
                                name="password"
                                label={AUTH_LABELS.PASSWORD_LABEL}
                                placeholder={AUTH_LABELS.PASSWORD_PLACEHOLDER}
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                                disabled={loading}
                                error={!!passwordError}
                                helperText={passwordError || AUTH_LABELS.HELPER_TEXT}
                                sx={{
                                    '& .MuiFormHelperText-root': { ml: 0, mt: 0.5 },
                                    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
                                        WebkitBoxShadow: (t) => `0 0 0 100px ${t.palette.background.paper} inset`,
                                        WebkitTextFillColor: (t) => t.palette.text.primary,
                                        caretColor: (t) => t.palette.text.primary,
                                        transition: 'background-color 9999s ease-in-out 0s',
                                    },
                                }}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{
                                mt: 2,
                                mb: 2.5,
                                py: 1.8,
                                fontSize: '16px'
                            }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : AUTH_LABELS.LOGIN_BUTTON}
                        </Button>

                        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', mb: 2.5 }}>
                            <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider' }} />
                            <Typography
                                variant="body2"
                                sx={{
                                    px: 2,
                                    color: 'text.secondary',
                                    fontWeight: 500
                                }}
                            >
                                {AUTH_LABELS.OR_SEPARATOR}
                            </Typography>
                            <Box sx={{ flexGrow: 1, height: '1px', bgcolor: 'divider' }} />
                        </Box>

                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            onClick={handleGoogleLogin}
                            startIcon={googleLoading ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
                            disabled={googleLoading}
                            sx={{
                                py: 1.8,
                                fontWeight: 400,
                                fontSize: '14px'
                            }}
                        >
                            {AUTH_LABELS.GOOGLE_LOGIN_BUTTON}
                        </Button>
                    </Box>
                </Paper>
            </Container>

            {/* Backend unavailability notification */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity="warning"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LoginPage;
