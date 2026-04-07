import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/auth/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';
import AuthService from '../../app/auth/AuthService';
import { normalizeRole, getDefaultRouteForRole } from '../../app/auth/roleUtils';

/**
 * Handle success OAuth2 callback from the backend.
 * Extracts token from URL and initializes the user session.
 */
const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { verifySession } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            // Store token immediately to allow verifySession to use it
            localStorage.setItem('token', token);
            
            // Verify session to get role, userId and update AuthContext
            verifySession()
                .then(() => {
                    const role = normalizeRole(AuthService.getRole());
                    navigate(getDefaultRouteForRole(role), { replace: true });
                })
                .catch((err) => {
                    console.error('OAuth callback session verification failed:', err);
                    navigate('/login?error=oauth_failed', { replace: true });
                });
        } else {
            console.error('No token found in OAuth callback URL');
            navigate('/login', { replace: true });
        }
    }, [location, navigate, verifySession]);

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                bgcolor: 'background.default'
            }}
        >
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" color="text.secondary">
                Вхід через Google...
            </Typography>
        </Box>
    );
};

export default OAuthCallback;
