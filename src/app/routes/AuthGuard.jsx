import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectCurrentRole,
  selectAuthLoading,
  selectIsSuperUser,
  selectIsSuperUserDemoMode,
} from "../../store/slices/authSlice";
import { Skeleton } from "../../design-system/primitives/Skeleton";

export function AuthGuard({ allowedRoles, children }) {
  const currentUser = useSelector(selectCurrentUser);
  const currentRole = useSelector(selectCurrentRole);
  const authLoading = useSelector(selectAuthLoading);
  const isSuperUser = useSelector(selectIsSuperUser);
  const isSuperUserDemoMode = useSelector(selectIsSuperUserDemoMode);

  if (authLoading) return <Skeleton height="200px" />;
  if (!currentUser || currentRole === "guest") {
    return <Navigate to="/" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(currentRole) &&
    !isSuperUser &&
    !isSuperUserDemoMode
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}
