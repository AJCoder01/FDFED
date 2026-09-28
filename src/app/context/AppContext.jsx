import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../../data/mockData';
import { getNotifications, resetDemoData as repoResetDemoData } from '../../data/mockRepository';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentRole, setCurrentRole] = useState('customer'); // guest, customer, provider, admin, arbitrator
  const [currentUser, setCurrentUser] = useState(DEMO_USERS.customer);
  const [notifications, setNotifications] = useState([]);
  const [savedIntent, setSavedIntent] = useState(null); // stores { serviceId, slot, address } for post-auth return
  const [toast, setToast] = useState({ message: null, type: 'info' });

  // Update currentUser when role changes
  const switchRole = (newRole) => {
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
    switchRole('customer');
    await loadNotifications();
    showToast(res.message, 'success');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentRole,
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
