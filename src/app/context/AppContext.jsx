import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DEMO_USERS } from '../../data/mockData';
import { getCustomerById, getNotifications, getProviderById, resetDemoData } from '../../data/mockRepository';
import { subscribeToRepository } from '../../data/repositoryEvents';

const AppContext = createContext();
const ROLE_KEY = 'servicehub_demo_role';
const THEME_KEY = 'servicehub_theme';
const roles = ['guest', 'customer', 'provider', 'admin', 'arbitrator'];
const initialRole = () => roles.includes(localStorage.getItem(ROLE_KEY)) ? localStorage.getItem(ROLE_KEY) : 'guest';

export function AppProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(initialRole);
  const [currentUser, setCurrentUser] = useState(() => DEMO_USERS[initialRole()] || null);
  const [isSuperUser, setIsSuperUser] = useState(() => initialRole() === 'admin');
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
      const user = DEMO_USERS[currentRole];
      if (!user) { setCurrentUser(null); setNotifications([]); return; }
      try {
        const [profile, list] = await Promise.all([
          currentRole === 'provider' ? getProviderById(user.id) : currentRole === 'customer' ? getCustomerById(user.id) : Promise.resolve(user),
          getNotifications(user.id)
        ]);
        if (active && latest === request) { setCurrentUser(profile); setNotifications(list); }
      } catch (error) {
        if (active) showToast(error.message, 'error');
      }
    };
    reload();
    const unsubscribe = subscribeToRepository(reload);
    return () => { active = false; unsubscribe(); };
  }, [currentRole, showToast]);

  const switchRole = (role, preserveSuperUser = false) => {
    if (!roles.includes(role)) return;
    localStorage.setItem(ROLE_KEY, role);
    setIsSuperUser(value => role === 'admin' || (preserveSuperUser && value));
    if (role === currentRole) return;
    setCurrentRole(role);
    setCurrentUser(DEMO_USERS[role] || null);
    setNotifications([]);
  };
  const reloadNotifications = useCallback(async () => {
    const id = currentUser?.id;
    const list = id ? await getNotifications(id) : [];
    if (userId.current === id) setNotifications(list);
  }, [currentUser?.id]);
  const handleResetDemoData = async () => {
    try {
      const result = await resetDemoData();
      switchRole('guest');
      setSavedIntent(null);
      showToast(result.message);
    } catch (error) { showToast(error.message, 'error'); }
  };

  return (
    <AppContext.Provider value={{
      currentRole, currentUser, isSuperUser, switchRole, theme,
      toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light'),
      notifications, unreadCount: notifications.filter(notification => !notification.read).length,
      reloadNotifications, savedIntent, setSavedIntent, showToast, toast, clearToast, handleResetDemoData
    }}>
      {children}
    </AppContext.Provider>
  );
}
export const useApp = () => useContext(AppContext);
