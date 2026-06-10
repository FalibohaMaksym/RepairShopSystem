import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../../pages/auth/LoginPage';
import OAuthCallback from '../../pages/auth/OAuthCallback';
import ActiveRepairOrdersPage from '../../pages/repairs/ActiveRepairOrdersPage';
import ArchivedRepairOrdersPage from '../../pages/repairs/ArchivedRepairOrdersPage';
import OrderDetailsPage from '../../pages/repairs/OrderDetailsPage';
import UsersManagementPage from '../../pages/management/UsersManagementPage';
import DataManagementPage from '../../pages/management/DataManagementPage';
import AnalyticsPage from '../../pages/repairs/AnalyticsPage';
import ActiveSuppliesPage from '../../pages/supplies/ActiveSuppliesPage';
import ArchivedSuppliesPage from '../../pages/supplies/ArchivedSuppliesPage';
import ComponentOrderDetailPage from '../../pages/supplies/ComponentOrderDetailPage';
import MainLayout from '../layout/MainLayout';
import ProtectedRoute from '../auth/ProtectedRoute';
import { useAuth } from '../auth/AuthContext';
import { APP_ROLES, getDefaultRouteForRole, normalizeRole } from '../auth/roleUtils';

const RoleHomeRedirect = () => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  return <Navigate to={getDefaultRouteForRole(role)} replace />;
};

const RequireRole = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  return children;
};

/**
 * Application routing configuration.
 */
export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth2/callback" element={<OAuthCallback />} />

      {/* Protected Routes */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<RoleHomeRedirect />} />

        <Route
          path="/repairs/active"
          element={
            <RequireRole allowedRoles={[APP_ROLES.MASTER, APP_ROLES.ADMIN, APP_ROLES.SENIOR_ADMIN]}>
              <ActiveRepairOrdersPage />
            </RequireRole>
          }
        />
        <Route
          path="/repairs/:orderNumber"
          element={
            <RequireRole allowedRoles={[APP_ROLES.MASTER, APP_ROLES.ADMIN, APP_ROLES.SENIOR_ADMIN]}>
              <OrderDetailsPage />
            </RequireRole>
          }
        />
        <Route
          path="/repairs/archive"
          element={
            <RequireRole allowedRoles={[APP_ROLES.ADMIN, APP_ROLES.SENIOR_ADMIN]}>
              <ArchivedRepairOrdersPage />
            </RequireRole>
          }
        />
        <Route
          path="/repairs/analytics"
          element={
            <RequireRole allowedRoles={[APP_ROLES.SENIOR_ADMIN]}>
              <AnalyticsPage />
            </RequireRole>
          }
        />
        <Route
          path="/supplies/active"
          element={
            <RequireRole allowedRoles={[APP_ROLES.SENIOR_ADMIN]}>
              <ActiveSuppliesPage />
            </RequireRole>
          }
        />
        <Route
          path="/supplies/archive"
          element={
            <RequireRole allowedRoles={[APP_ROLES.SENIOR_ADMIN]}>
              <ArchivedSuppliesPage />
            </RequireRole>
          }
        />
        <Route
          path="/supplies/:supplyId"
          element={
            <RequireRole allowedRoles={[APP_ROLES.SENIOR_ADMIN]}>
              <ComponentOrderDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="/management/data"
          element={
            <RequireRole allowedRoles={[APP_ROLES.SYSTEM_ADMIN]}>
              <DataManagementPage />
            </RequireRole>
          }
        />
        <Route
          path="/management/users"
          element={
            <RequireRole allowedRoles={[APP_ROLES.SYSTEM_ADMIN]}>
              <UsersManagementPage />
            </RequireRole>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<RoleHomeRedirect />} />
    </Routes>
  );
};

