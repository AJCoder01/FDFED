import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import usersReducer from './slices/usersSlice.js';
import marketplaceReducer from './slices/marketplaceSlice.js';
import bookingsReducer from './slices/bookingsSlice.js';
import financeReducer from './slices/financeSlice.js';
import governanceReducer from './slices/governanceSlice.js';
import notificationsReducer from './slices/notificationsSlice.js';
import platformReducer from './slices/platformSlice.js';
import uiReducer from './slices/uiSlice.js';

export function createAppStore(preloadedState) {
  return configureStore({
    reducer: {
      auth: authReducer,
      users: usersReducer,
      marketplace: marketplaceReducer,
      bookings: bookingsReducer,
      finance: financeReducer,
      governance: governanceReducer,
      notifications: notificationsReducer,
      platform: platformReducer,
      ui: uiReducer,
    },
    preloadedState,
  });
}

export const store = createAppStore();
