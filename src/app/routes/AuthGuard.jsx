import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function AuthGuard({ allowedRoles, children }) {
  const { currentRole } = useApp();

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
