import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectAuthHydrated,
  selectCurrentRole,
  selectCurrentUser,
  selectIsSuperUser,
  selectIsSuperUserDemoMode,
} from '../../store/slices/authSlice';
import { Skeleton } from '../../design-system/primitives/Skeleton';

export function AuthGuard({ allowedRoles, children }) {
  const currentRole = useSelector(selectCurrentRole);
  const currentUser = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectIsSuperUser);
  const isSuperUserDemoMode = useSelector(selectIsSuperUserDemoMode);
  const hydrated = useSelector(selectAuthHydrated);

  if (!hydrated) {
    return <Skeleton height="300px" />;
  }

  if (!currentUser || currentRole === 'guest') {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole) && !isSuperUser && !isSuperUserDemoMode) {
    return <Navigate to="/" replace />;
  }

  return children;
}
