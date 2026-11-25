import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { notificationsRepository } from '../../repositories/notificationsRepository.js';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (userId, { rejectWithValue }) => {
    try {
      return await notificationsRepository.fetchNotifications(userId);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to load notifications.');
    }
  },
);

export const createNotification = createAsyncThunk(
  'notifications/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await notificationsRepository.createNotification(payload);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to create notification.');
    }
  },
);

export const markNotificationsRead = createAsyncThunk(
  'notifications/markRead',
  async ({ userId, notificationId } = {}, { rejectWithValue }) => {
    try {
      return await notificationsRepository.markNotificationsRead({ userId, notificationId });
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to mark notifications read.');
    }
  },
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteOne',
  async (id, { rejectWithValue }) => {
    try {
      await notificationsRepository.deleteNotification(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to delete notification.');
    }
  },
);

export const clearNotifications = createAsyncThunk('notifications/clearAll', async (_, { rejectWithValue }) => {
  try {
    await notificationsRepository.clearNotifications();
    return [];
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to clear notifications.');
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    loading: false,
    error: null,
    mutationStatus: 'idle',
    mutationError: null,
  },
  reducers: {
    clearNotificationsLocal(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createNotification.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items = [action.payload, ...state.items];
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(markNotificationsRead.pending, (state) => {
        state.mutationStatus = 'loading';
      })
      .addCase(markNotificationsRead.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items = action.payload || [];
      })
      .addCase(markNotificationsRead.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items = state.items.filter((n) => n.id !== action.payload);
      })
      .addCase(clearNotifications.fulfilled, (state) => {
        state.mutationStatus = 'succeeded';
        state.items = [];
      })

      .addMatcher(
        (action) => action.type === 'auth/logout/fulfilled' || action.type === 'platform/resetDemo/fulfilled',
        (state) => {
          state.items = [];
        },
      );
  },
});

export const { clearNotificationsLocal } = notificationsSlice.actions;

const selectNotificationsSlice = (state) => state.notifications;
export const selectNotifications = createSelector(selectNotificationsSlice, (s) => s.items);
export const selectUnreadNotificationsCount = createSelector(
  selectNotifications,
  (items) => items.filter((item) => !item.read).length,
);
export const selectNotificationsLoading = createSelector(selectNotificationsSlice, (s) => s.loading);

export default notificationsSlice.reducer;
