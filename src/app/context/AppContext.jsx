import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  startTransition,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  restoreSessionThunk,
  loginThunk,
  signupThunk,
  logoutThunk,
  switchDemoRoleThunk,
  fetchCurrentUserThunk,
  setSavedIntent,
  clearSavedIntent,
  selectCurrentUser,
  selectCurrentRole,
  selectAuthLoading,
  selectAuthError,
  selectSavedIntent,
  selectIsSuperUser,
  selectIsSuperUserDemoMode,
} from "../../store/slices/authSlice";
import {
  fetchNotificationsThunk,
  resetDemoDataThunk,
  selectNotifications,
  selectUnreadCount,
} from "../../store/slices/platformSlice";
import { subscribeToRepository } from "../../data/repositoryEvents";

const AppContext = createContext();

export const isSuperUserAccount = (user) =>
  user?.role === "admin" && user?.isSuperUser === true;

export function AppProvider({ children }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const currentRole = useSelector(selectCurrentRole);
  const authLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const savedIntent = useSelector(selectSavedIntent);
  const isSuperUser = useSelector(selectIsSuperUser);
  const isSuperUserDemoMode = useSelector(selectIsSuperUserDemoMode);
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  const [theme, setTheme] = useState(() =>
    localStorage.getItem("servicehub_theme") === "dark" ? "dark" : "light"
  );
  const [toast, setToast] = useState({ message: null, type: "info" });

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    []
  );
  const clearToast = useCallback(
    () => setToast({ message: null, type: "info" }),
    []
  );

  useEffect(() => {
    dispatch(restoreSessionThunk());

    const expire = () => {
      dispatch(logoutThunk());
    };
    window.addEventListener("servicehub:session-expired", expire);
    return () => {
      window.removeEventListener("servicehub:session-expired", expire);
    };
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("servicehub_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }
    const reload = async () => {
      try {
        await Promise.all([
          dispatch(fetchCurrentUserThunk()).unwrap(),
          dispatch(fetchNotificationsThunk()).unwrap(),
        ]);
      } catch (e) {
        // quiet error or toast on periodic polling
      }
    };
    reload();
    const unsubscribe = subscribeToRepository(reload);
    const interval = setInterval(reload, 30000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentUser?.id, dispatch]);

  const login = async (email, password, role) => {
    const result = await dispatch(
      loginThunk({ email, password, role })
    ).unwrap();
    return result;
  };

  const signup = async (data) => {
    const result = await dispatch(signupThunk(data)).unwrap();
    return result;
  };

  const logout = useCallback(async () => {
    await dispatch(logoutThunk()).unwrap();
  }, [dispatch]);

  const switchRole = async (role) => {
    try {
      if (role === "guest") {
        await logout();
        return { success: true, path: "/" };
      }
      const u = await dispatch(switchDemoRoleThunk(role)).unwrap();
      return { success: true, path: `/${u.role}` };
    } catch (e) {
      showToast(e.message || "Failed to switch role", "error");
      return { success: false, path: `/${currentRole}` };
    }
  };

  const reloadNotifications = useCallback(async () => {
    if (currentUser) {
      await dispatch(fetchNotificationsThunk()).unwrap();
    }
  }, [currentUser?.id, dispatch]);

  const handleResetDemoData = async () => {
    try {
      const r = await dispatch(resetDemoDataThunk()).unwrap();
      await logout();
      showToast(r.message || "Demo data reset successfully.");
    } catch (e) {
      showToast(e.message || "Failed to reset demo data.", "error");
    }
  };

  const setIntent = useCallback(
    (intent) => {
      if (intent) {
        dispatch(setSavedIntent(intent));
      } else {
        dispatch(clearSavedIntent());
      }
    },
    [dispatch]
  );

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentUser,
        authLoading,
        authError,
        isSuperUser,
        isSuperUserDemoMode,
        demoEnabled: !!currentUser?.demoEnabled,
        switchRole,
        theme,
        login,
        signup,
        logout,
        toggleTheme: () => setTheme((v) => (v === "light" ? "dark" : "light")),
        notifications,
        unreadCount,
        reloadNotifications,
        savedIntent,
        setSavedIntent: setIntent,
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
