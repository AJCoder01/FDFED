import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  startTransition,
} from "react";
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
const AppContext = createContext();
export const isSuperUserAccount = (user) =>
  user?.role === "admin" && user?.isSuperUser === true;
export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("servicehub_theme") === "dark" ? "dark" : "light",
  );
  const [notifications, setNotifications] = useState([]);
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
    refreshSession()
      .then((user) => {
        if (active) setCurrentUser(user);
      })
      .catch((e) => {
        if (active) setAuthError(e.message);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    const expire = () => setCurrentUser(null);
    window.addEventListener("servicehub:session-expired", expire);
    return () => {
      active = false;
      window.removeEventListener("servicehub:session-expired", expire);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("servicehub_theme", theme);
  }, [theme]);
  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }
    let active = true;
    let request = 0;
    const reload = async () => {
      const version = ++request;
      try {
        const [profile, list] = await Promise.all([
          getUserProfile(),
          getNotifications(),
        ]);
        if (active && version === request) {
          setCurrentUser(profile);
          setNotifications(list);
        }
      } catch (e) {
        if (active) showToast(e.message, "error");
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
  }, [currentUser?.id, showToast]);
  const login = async (...args) => {
    const u = await authenticateUser(...args);
    setCurrentUser(u);
    setAuthError("");
    return u;
  };
  const signup = async (data) => {
    const u = await signUpUser(data);
    setCurrentUser(u);
    return u;
  };
  const logout = useCallback(async () => {
    await logoutUser();
    // Match the router's transition priority so a protected route cannot redirect
    // before the caller's navigation to the public page is committed.
    startTransition(() => {
      setCurrentUser(null);
      setNotifications([]);
      setSavedIntent(null);
    });
  }, []);
  const switchRole = async (role) => {
    try {
      if (role === "guest") {
        await logout();
        return { success: true, path: "/" };
      }
      const u = await switchDemoRole(role);
      startTransition(() => setCurrentUser(u));
      return { success: true, path: `/${u.role}` };
    } catch (e) {
      showToast(e.message, "error");
      return { success: false, path: `/${currentRole}` };
    }
  };
  const reloadNotifications = useCallback(async () => {
    if (currentUser) setNotifications(await getNotifications());
  }, [currentUser?.id]);
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
        login,
        signup,
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
