import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../../data/mockData';
import { getNotifications, resetDemoData as repoResetDemoData } from '../../data/mockRepository';

const AppContext = createContext();
const ROLE_STORAGE_KEY = 'servicehub_demo_role';
const THEME_STORAGE_KEY = 'servicehub_theme';
const VALID_ROLES = ['guest', 'customer', 'provider', 'admin', 'arbitrator'];

export function AppProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(() => {
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY);
    return VALID_ROLES.includes(storedRole) ? storedRole : 'guest';
  }); // guest, customer, provider, admin, arbitrator
  const [currentUser, setCurrentUser] = useState(() => {
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY);
    return VALID_ROLES.includes(storedRole) && storedRole !== 'guest'
      ? DEMO_USERS[storedRole]
      : null;
  });
  const [isSuperUser, setIsSuperUser] = useState(() => localStorage.getItem(ROLE_STORAGE_KEY) === 'admin');
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light');
  const [notifications, setNotifications] = useState([]);
  const [savedIntent, setSavedIntent] = useState(null); // stores { serviceId, slot, address } for post-auth return
  const [toast, setToast] = useState({ message: null, type: 'info' });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(currentTheme => currentTheme === 'light' ? 'dark' : 'light');
  };

  // Update currentUser when role changes
  const switchRole = (newRole, preserveSuperUser = false) => {
    localStorage.setItem(ROLE_STORAGE_KEY, newRole);

    if (newRole === 'admin') setIsSuperUser(true);
    else if (!preserveSuperUser) setIsSuperUser(false);

    setCurrentRole(newRole);
    if (newRole === 'guest') {
      setCurrentUser(null);
    } else if (newRole === 'customer') {
      setCurrentUser(DEMO_USERS.customer);
    } else if (newRole === 'provider') {
      setCurrentUser(DEMO_USERS.provider);
    } else if (newRole === 'admin') {
      setCurrentUser(DEMO_USERS.admin);
    } else if (newRole === 'arbitrator') {
      setCurrentUser(DEMO_USERS.arbitrator);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast({ message: null, type: 'info' });
  };

  const loadNotifications = async () => {
    if (currentUser) {
      const list = await getNotifications(currentUser.id);
      setNotifications(list);
    } else {
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const handleResetDemoData = async () => {
    const res = await repoResetDemoData();
    switchRole('guest');
    await loadNotifications();
    showToast(res.message, 'success');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentRole,
        theme,
        toggleTheme,
        isSuperUser,
        currentUser,
        switchRole,
        notifications,
        unreadCount,
        savedIntent,
        setSavedIntent,
        showToast,
        toast,
        clearToast,
        handleResetDemoData,
        reloadNotifications: loadNotifications
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
