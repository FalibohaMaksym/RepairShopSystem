import axios from 'axios';
import AuthService from './AuthService';

let isRedirectingToLogin = false;

const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor — adds JWT token and records request start time.
 */
apiClient.interceptors.request.use(
    (config) => {
        const token = AuthService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config.metadata = { startTime: performance.now() };
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor — handles global errors (like 401) and logs request timing.
apiClient.interceptors.response.use(
    (response) => {
        const duration = performance.now() - (response.config.metadata?.startTime ?? performance.now());
        const method = response.config.method?.toUpperCase() ?? '?';
        const url = response.config.url ?? '';
        return response;
    },
    (error) => {
        const duration = performance.now() - (error.config?.metadata?.startTime ?? performance.now());
        const method = error.config?.method?.toUpperCase() ?? '?';
        const url = error.config?.url ?? '';
        console.warn(`[API] ${method} ${url} — ${Math.round(duration)} ms (помилка)`);

        const requestUrl = error.config?.url ?? '';
        const isLoginRequest = requestUrl.endsWith('/auth/login');
        const isAuthPage = window.location.pathname === '/login' || window.location.pathname.startsWith('/oauth');
        
        if (error.response && error.response.status === 401 && !isLoginRequest && !isAuthPage && !isRedirectingToLogin) {
            // Unauthenticated - clear local state and redirect
            isRedirectingToLogin = true;
            AuthService.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
