import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';

import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';

import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';
import AdminVillages from './pages/admin/Villages';
import AdminLogs from './pages/admin/Logs';

import B2BLayout from './components/B2BLayout';
import B2BDashboard from './pages/b2b/Dashboard';
import B2BApiKeys from './pages/b2b/ApiKeys';
import B2BDocs from './pages/b2b/Docs';

function RequireAuth({ children, adminOnly = false }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && !user?.isAdmin) return <Navigate to="/portal" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/admin" element={<RequireAuth adminOnly><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="villages" element={<AdminVillages />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>

      <Route path="/portal" element={<RequireAuth><B2BLayout /></RequireAuth>}>
        <Route index element={<B2BDashboard />} />
        <Route path="keys" element={<B2BApiKeys />} />
        <Route path="docs" element={<B2BDocs />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
