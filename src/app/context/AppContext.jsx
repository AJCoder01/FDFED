import { createContext, useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSession,
  forceGuestState,
  loginUser,
  logoutUser,
  selectAuthHydrated,
  selectCurrentRole,
  selectCurrentUser,
  selectIsSuperUser,
  selectIsSuperUserDemoMode,
  selectSavedIntent,
  setSavedIntent as setSavedIntentAction,
  signupUser,
  switchDemoRole,
} from '../../store/slices/authSlice';
import {
  fetchNotifications,
  selectNotifications,
  selectUnreadNotificationsCount,
} from '../../store/slices/notificationsSlice';
import { resetDemoData } from '../../store/slices/platformSlice';
import {
  clearToast as clearToastAction,
  selectTheme,
  selectToast,
  showToast as showToastAction,
  toggleTheme as toggleThemeAction,
} from '../../store/slices/uiSlice';
import { setAccessToken } from '../../repositories/apiClient';

const AppContext = createContext();
const BOOT_KEY = 'servicehub_server_boot_id';

const currentBootId = typeof __SERVER_BOOT_ID__ !== 'undefined' ? __SERVER_BOOT_ID__ : null;
if (currentBootId && typeof window !== 'undefined') {
  try {
    const lastBootId = localStorage.getItem(BOOT_KEY);
    if (lastBootId !== currentBootId) {
      localStorage.setItem(BOOT_KEY, currentBootId);
      setAccessToken(null);
      if (window.location.pathname !== '/') {
        window.history.replaceState(null, '', '/');
      }
    }
  } catch {
    // Storage access fallback
  }
}

export { isSuperUserAccount } from '../../store/slices/authSlice';

export function AppProvider({ children }) {
  const dispatch = useDispatch();

  const currentRole = useSelector(selectCurrentRole);
  const currentUser = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectIsSuperUser);
  const isSuperUserDemoMode = useSelector(selectIsSuperUserDemoMode);
  const savedIntent = useSelector(selectSavedIntent);
  const authHydrated = useSelector(selectAuthHydrated);
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadNotificationsCount);
  const theme = useSelector(selectTheme);
  const toast = useSelector(selectToast);

  const showToast = useCallback(
    (message, type = 'success') => dispatch(showToastAction({ message, type })),
    [dispatch],
  );
  const clearToast = useCallback(() => dispatch(clearToastAction()), [dispatch]);
  const setSavedIntent = useCallback((intent) => dispatch(setSavedIntentAction(intent)), [dispatch]);
  const toggleTheme = useCallback(() => dispatch(toggleThemeAction()), [dispatch]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!authHydrated) {
      dispatch(fetchSession());
    }
  }, [authHydrated, dispatch]);

  useEffect(() => {
    if (currentUser?.id && currentRole !== 'guest') {
      dispatch(fetchNotifications(currentUser.id));
    }
  }, [currentRole, currentUser?.id, dispatch]);

  const login = useCallback(
    async (email, password, expectedRole) => {
      const res = await dispatch(loginUser({ email, password, expectedRole })).unwrap();
      return res.user;
    },
    [dispatch],
  );

  const signup = useCallback(
    async (userData) => {
      const res = await dispatch(signupUser(userData)).unwrap();
      return res.user;
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser()).unwrap();
  }, [dispatch]);

  const switchRole = useCallback(
    async (targetRole) => {
      const destinations = {
        customer: '/customer',
        provider: '/provider',
        admin: '/admin',
        superuser: '/admin',
        staffAdmin: '/admin',
        arbitrator: '/arbitrator',
        guest: '/',
      };
      await dispatch(switchDemoRole(targetRole)).unwrap();
      return {
        success: true,
        path: destinations[targetRole] || '/',
      };
    },
    [dispatch],
  );

  const reloadNotifications = useCallback(async () => {
    if (!currentUser?.id) return [];
    return dispatch(fetchNotifications(currentUser.id)).unwrap();
  }, [currentUser?.id, dispatch]);

  const handleResetDemoData = useCallback(async () => {
    try {
      const result = await dispatch(resetDemoData()).unwrap();
      dispatch(forceGuestState());
      showToast(result?.message || 'Demo data reset.');
    } catch (error) {
      showToast(error?.message || String(error), 'error');
    }
  }, [dispatch, showToast]);

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentUser,
        isSuperUser,
        isSuperUserDemoMode,
        switchRole,
        theme,
        login,
        signup,
        logout,
        toggleTheme,
        notifications,
        unreadCount,
        reloadNotifications,
        savedIntent,
        setSavedIntent,
        showToast,
        toast,
        clearToast,
        handleResetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
