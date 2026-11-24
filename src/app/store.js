import { configureStore, createSlice } from '@reduxjs/toolkit';

const sessionSlice = createSlice({
  name: 'session',
  initialState: {
    user: null,
    loading: true,
    error: '',
    identity: 0,
    notifications: [],
  },
  reducers: {
    sessionReplaced(state, { payload: user }) {
      state.identity++;
      state.user = user;
      state.loading = false;
      state.error = '';
      state.notifications = [];
    },
    sessionRestored(state, { payload: user }) {
      if (state.user?.id !== user?.id) {
        state.identity++;
        state.notifications = [];
      }
      state.user = user;
      state.loading = false;
      state.error = '';
    },
    restorationFailed(state, { payload: error }) {
      if (!state.loading) return;
      state.loading = false;
      state.error = error;
    },
    profileLoaded(state, { payload: { identity, profile } }) {
      if (state.identity === identity && state.user?.id === profile.id) {
        state.user = profile;
      }
    },
    notificationsLoaded(state, { payload: { identity, notifications } }) {
      if (state.identity === identity && state.user) {
        state.notifications = notifications;
      }
    },
  },
});

export const { sessionReplaced, sessionRestored, restorationFailed, profileLoaded, notificationsLoaded } = sessionSlice.actions;
export const store = configureStore({ reducer: { session: sessionSlice.reducer } });
