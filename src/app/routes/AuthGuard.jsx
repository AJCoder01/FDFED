import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function AuthGuard({ allowedRoles, children }) {
  const { currentRole, currentUser, isSuperUser } = useApp();

  if (!currentUser || currentRole === 'guest') {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole) && !isSuperUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}
