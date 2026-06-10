import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AuthService from './AuthService';

const AuthContext = createContext(null);

/**
 * Provider component for authentication.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (AuthService.getToken()) {
                try {
                    await AuthService.me();
                    setUser(AuthService.getCurrentUser());
                } catch (error) {
                    console.error('Session validation failed:', error);
                    AuthService.logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = useCallback(async (identifier, password) => {
        const data = await AuthService.login(identifier, password);
        setUser(AuthService.getCurrentUser());
        return data;
    }, []);

    const logout = useCallback(() => {
        AuthService.logout();
        setUser(null);
    }, []);

    // useCallback з [] — гарантує стабільне посилання між рендерами.
    // Це критично для OAuthCallback: без стабільного verifySession
    // useEffect бачить нову функцію після кожного ре-рендеру і запускається
    // знову → нескінченний цикл (OAuthCallback unmount/remount через loading).
    const verifySession = useCallback(async () => {
        setLoading(true);
        try {
            await AuthService.me();
            setUser(AuthService.getCurrentUser());
        } catch (error) {
            console.error('Session validation failed:', error);
            AuthService.logout();
            setUser(null);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const value = {
        user,
        loading,
        login,
        logout,
        verifySession,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

/**
 * Hook to use the auth context.
 * @returns {Object}
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
