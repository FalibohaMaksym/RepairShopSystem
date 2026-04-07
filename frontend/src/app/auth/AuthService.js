import axios from 'axios';
import {jwtDecode} from 'jwt-decode';
import apiClient from './axiosConfig';

const API_URL = 'http://localhost:8080/api/auth';

/**
 * Service for handling authentication operations.
 */
class AuthService {
    /**
     * Authenticates a user with credentials.
     * @param {string} login Email or phone number
     * @param {string} password 
     * @returns {Promise<Object>} The response containing the JWT and user info.
     */
    async login(login, password) {
        try {
            const response = await apiClient.post('/auth/login', { login, password });
            
            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('workerId', response.data.workerId ?? '');
                localStorage.setItem('userName', response.data.fullName || response.data.fullname || response.data.name || '');
                localStorage.setItem('branchId', response.data.branchId ?? '');
            }

            return response.data;
        } catch (error) {
            console.error('AuthService login error:', error);
            throw error;
        }
    }

    /**
     * Retrieves current user data from the backend to verify the session.
     * @returns {Promise<Object>}
     */
    async me() {
        try {
            const response = await apiClient.get('/auth/me');
            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('workerId', response.data.workerId ?? '');
                localStorage.setItem('userName', response.data.fullName || response.data.fullname || response.data.name || '');
                localStorage.setItem('branchId', response.data.branchId ?? '');
            }
            return response.data;
        } catch (error) {
            console.error('AuthService me error:', error);
            throw error;
        }
    }

    /**
     * Logs out the user and clears stored data.
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('workerId');
        localStorage.removeItem('userName');
        localStorage.removeItem('branchId');
    }

    /**
     * Retrieves the stored token.
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem('token');
    }

    /**
     * Retrieves the stored user role.
     * @returns {string|null}
     */
    getRole() {
        return localStorage.getItem('role');
    }

    /**
     * Retrieves the stored user ID.
     * @returns {string|null}
     */
    getUserId() {
        return localStorage.getItem('userId');
    }

    /**
     * Retrieves the stored worker ID.
     * @returns {string|null}
     */
    getWorkerId() {
        return localStorage.getItem('workerId');
    }

    /**
     * Retrieves the stored user name.
     * @returns {string|null}
     */
    getUserName() {
        return localStorage.getItem('userName');
    }

    /**
     * Retrieves the branch ID of the current user.
     * Falls back to the branchId claim in the JWT if not stored separately.
     * @returns {number|null}
     */
    getBranchId() {
        const stored = localStorage.getItem('branchId');
        if (stored) return Number(stored);
        // Fallback: read from JWT claims if backend embeds it there
        try {
            const decoded = this.getCurrentUser();
            const id = decoded?.branchId ?? decoded?.branch_id ?? null;
            return id != null ? Number(id) : null;
        } catch {
            return null;
        }
    }

    /**
     * Retrieves the current user details from the token and storage.
     * @returns {Object|null}
     */
    getCurrentUser() {
        const token = this.getToken();
        if (!token) return null;
        try {
            const decoded = jwtDecode(token);
            return {
                ...decoded,
                role: this.getRole(),
                userId: this.getUserId(),
                workerId: this.getWorkerId(),
                name: this.getUserName()
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Checks if the user is authenticated.
     * @returns {boolean}
     */
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp > currentTime;
        } catch (error) {
            return false;
        }
    }

    _generateMockToken(username) {
        // Simplified mock token for demonstration
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: username,
            name: 'Administrator',
            role: 'ROLE_ADMIN',
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
        }));
        return `${header}.${payload}.mock_signature`;
    }
}

export default new AuthService();
