import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roleRequired }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading FarmConnect...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (roleRequired && user?.role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return children;
}
