import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  getCustomerById,
  getNotifications,
  getProviderById,
  getUserProfile,
  resetDemoData,
  authenticateUser,
  signUpUser,
  logActivity
} from '../../data/mockRepository';
import { subscribeToRepository } from '../../data/repositoryEvents';

const AppContext = createContext();
const ROLE_KEY = 'servicehub_demo_role';
const SESSION_USER_KEY = 'servicehub_session_user';
const BOOT_KEY = 'servicehub_server_boot_id';
const THEME_KEY = 'servicehub_theme';
const roles = ['guest', 'customer', 'provider', 'admin', 'arbitrator'];

// When localhost server restarts (new boot ID detected), reset active session to guest and redirect to landing page
const currentBootId = typeof __SERVER_BOOT_ID__ !== 'undefined' ? __SERVER_BOOT_ID__ : null;
if (currentBootId && typeof window !== 'undefined') {
  try {
    const lastBootId = localStorage.getItem(BOOT_KEY);
    if (lastBootId !== currentBootId) {
      localStorage.setItem(BOOT_KEY, currentBootId);
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(ROLE_KEY);
      if (window.location.pathname !== '/') {
        window.history.replaceState(null, '', '/');
      }
    }
  } catch {
    // Storage access fallback
  }
}

const getInitialSessionUser = () => {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && user.id && roles.includes(user.role) ? user : null;
  } catch {
    return null;
  }
};

const initialRole = () => {
  const user = getInitialSessionUser();
  if (user && roles.includes(user.role)) return user.role;
  return 'guest';
};

export function AppProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(initialRole);
  const [currentUser, setCurrentUser] = useState(getInitialSessionUser);
  const [isSuperUser, setIsSuperUser] = useState(() => {
    const user = getInitialSessionUser();
    return user?.role === 'admin' && user?.isSuperUser !== false;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light');
  const [notifications, setNotifications] = useState([]);
  const [savedIntent, setSavedIntent] = useState(null);
  const [toast, setToast] = useState({ message: null, type: 'info' });
  const userId = useRef(currentUser?.id);
  userId.current = currentUser?.id;
  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);
  const clearToast = useCallback(() => setToast({ message: null, type: 'info' }), []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    let request = 0;
    const reload = async () => {
      const latest = ++request;
      if (!currentUser?.id || currentRole === 'guest') {
        setNotifications([]);
        return;
      }
      try {
        const [profile, list] = await Promise.all([
          currentRole === 'provider'
            ? getProviderById(currentUser.id)
            : currentRole === 'customer'
            ? getCustomerById(currentUser.id)
            : getUserProfile(currentUser.id),
          getNotifications(currentUser.id)
        ]);
        if (active && latest === request) {
          if (profile) {
            const merged = { ...currentUser, ...profile };
            setCurrentUser(merged);
            localStorage.setItem(SESSION_USER_KEY, JSON.stringify(merged));
          }
          setNotifications(list || []);
        }
      } catch (error) {
        if (active) showToast(error.message, 'error');
      }
    };
    reload();
    const unsubscribe = subscribeToRepository(reload);
    return () => { active = false; unsubscribe(); };
  }, [currentRole, currentUser?.id, showToast]);

  const login = async (email, password, expectedRole) => {
    const user = await authenticateUser(email, password, expectedRole);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    localStorage.setItem(ROLE_KEY, user.role);
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsSuperUser(user.role === 'admin' && user.isSuperUser !== false);
    return user;
  };

  const signup = async (userData) => {
    const user = await signUpUser(userData);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    localStorage.setItem(ROLE_KEY, user.role);
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsSuperUser(user.role === 'admin' && user.isSuperUser === true);
    return user;
  };

  const logout = async () => {
    if (currentUser) {
      try {
        await logActivity({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          role: currentRole,
          type: 'LOGOUT',
          description: `User signed out: ${currentUser.name} (${currentRole.toUpperCase()})`
        });
      } catch {
        // Safe fallback
      }
    }
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.setItem(ROLE_KEY, 'guest');
    setCurrentRole('guest');
    setCurrentUser(null);
    setIsSuperUser(false);
    setNotifications([]);
  };

  const switchRole = (role) => {
    if (role === 'guest') {
      logout();
    }
  };

  const reloadNotifications = useCallback(async () => {
    const id = currentUser?.id;
    const list = id ? await getNotifications(id) : [];
    if (userId.current === id) setNotifications(list);
  }, [currentUser?.id]);

  const handleResetDemoData = async () => {
    try {
      const result = await resetDemoData();
      await logout();
      setSavedIntent(null);
      showToast(result.message);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <AppContext.Provider value={{
      currentRole, currentUser, isSuperUser, switchRole, theme,
      login, signup, logout,
      toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light'),
      notifications, unreadCount: notifications.filter(notification => !notification.read).length,
      reloadNotifications, savedIntent, setSavedIntent, showToast, toast, clearToast, handleResetDemoData
    }}>
      {children}
    </AppContext.Provider>
  );
}
export const useApp = () => useContext(AppContext);
