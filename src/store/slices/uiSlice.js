import { createSlice } from '@reduxjs/toolkit';

const THEME_KEY = 'servicehub_theme';

const getInitialTheme = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
    }
  } catch {
    // Fallback
  }
  return 'light';
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: getInitialTheme(),
    toast: { message: null, type: 'info' },
  },
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(THEME_KEY, state.theme);
        }
      } catch {
        // Fallback
      }
    },
    setTheme(state, action) {
      state.theme = action.payload === 'dark' ? 'dark' : 'light';
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(THEME_KEY, state.theme);
        }
      } catch {
        // Fallback
      }
    },
    showToast(state, action) {
      const payload = typeof action.payload === 'string'
        ? { message: action.payload, type: 'success' }
        : action.payload;
      state.toast = { message: payload?.message || null, type: payload?.type || 'success' };
    },
    clearToast(state) {
      state.toast = { message: null, type: 'info' };
    },
  },
});

export const { toggleTheme, setTheme, showToast, clearToast } = uiSlice.actions;
export const selectTheme = (state) => state.ui.theme;
export const selectToast = (state) => state.ui.toast;
export default uiSlice.reducer;
