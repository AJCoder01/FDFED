import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Skeleton } from "../../design-system/primitives/Skeleton";
import { ErrorState } from "../../design-system/primitives/ErrorState";
export function AuthGuard({ allowedRoles, children }) {
  const { currentRole, currentUser, authLoading, authError } = useApp();
  if (authLoading) return <Skeleton height="200px" />;
  if (authError)
    return (
      <ErrorState
        description={authError}
        onRetry={() => window.location.reload()}
      />
    );
  if (!currentUser)
    return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(currentRole))
    return <Navigate to={`/${currentRole}`} replace />;
  return children;
}
