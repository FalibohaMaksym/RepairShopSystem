import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Component to protect routes from unauthorized access.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return null; // Or a loading spinner
    }

    if (!isAuthenticated) {
        // Redirect to login page but save the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
