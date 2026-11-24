import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSelector, useStore } from "react-redux";
import {
  authenticateUser,
  signUpUser,
  getUserProfile,
  getNotifications,
  logoutUser,
  switchDemoRole,
  resetDemoData,
} from "../../data/apiRepository";
import { refreshSession } from "../../data/apiClient";
import { subscribeToRepository } from "../../data/repositoryEvents";
import { notificationsLoaded, profileLoaded, restorationFailed } from "../store";
const AppContext = createContext();
export const isSuperUserAccount = (user) =>
  user?.role === "admin" && user?.isSuperUser === true;
export function AppProvider({ children }) {
  const { user: currentUser, loading: authLoading, error: authError, identity, notifications } =
    useSelector((state) => state.session);
  const store = useStore();
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("servicehub_theme") === "dark" ? "dark" : "light",
  );
  const notificationRequest = useRef(0);
  const [savedIntent, setSavedIntent] = useState(null);
  const [toast, setToast] = useState({ message: null, type: "info" });
  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );
  const clearToast = useCallback(
    () => setToast({ message: null, type: "info" }),
    [],
  );
  const currentRole = currentUser?.role || "guest";
  useEffect(() => {
    let active = true;
    refreshSession().catch((error) => {
      if (active) store.dispatch(restorationFailed(error.message));
    });
    return () => { active = false; };
  }, [store]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("servicehub_theme", theme);
  }, [theme]);
  const reloadNotifications = useCallback(async () => {
    const { identity, user } = store.getState().session;
    if (!user) return;
    const request = ++notificationRequest.current;
    const notifications = await getNotifications();
    if (request === notificationRequest.current)
      store.dispatch(notificationsLoaded({ identity, notifications }));
  }, [store]);
  const userId = currentUser?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    let request = 0;
    const reload = async () => {
      const version = ++request;
      try {
        await Promise.all([
          getUserProfile().then((profile) => {
            if (active && version === request)
              store.dispatch(profileLoaded({ identity, profile }));
          }),
          reloadNotifications(),
        ]);
      } catch (e) {
        if (active && version === request && store.getState().session.identity === identity)
          showToast(e.message, "error");
      }
    };
    reload();
    const unsubscribe = subscribeToRepository(reload);
    const interval = setInterval(reload, 30000);
    return () => {
      active = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [userId, identity, reloadNotifications, showToast, store]);
  const logout = useCallback(async () => {
    await logoutUser();
    setSavedIntent(null);
  }, []);
  const switchRole = async (role) => {
    try {
      if (role === "guest") {
        await logout();
        return { success: true, path: "/" };
      }
      const u = await switchDemoRole(role);
      return { success: true, path: `/${u.role}` };
    } catch (e) {
      showToast(e.message, "error");
      return { success: false, path: `/${currentRole}` };
    }
  };
  const handleResetDemoData = async () => {
    try {
      const r = await resetDemoData();
      await logout();
      showToast(r.message);
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentUser,
        authLoading,
        authError,
        isSuperUser: isSuperUserAccount(currentUser),
        isSuperUserDemoMode: !!currentUser?.canDemoSwitch,
        demoEnabled: !!currentUser?.demoEnabled,
        switchRole,
        theme,
        login: authenticateUser,
        signup: signUpUser,
        logout,
        toggleTheme: () => setTheme((v) => (v === "light" ? "dark" : "light")),
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
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
