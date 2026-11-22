import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getNotifications,
  markNotificationsRead,
  getAccounts,
  getActivityLogs,
  getArbitratorApplications,
  submitArbitratorApplication,
  approveArbitratorApplication,
  rejectArbitratorApplication,
  resetDemoData,
  createCustomJobRequest,
  getCustomJobRequests
} from '../../data/apiRepository.js';
import { logoutThunk } from './authSlice.js';

export const fetchNotificationsThunk = createAsyncThunk(
  'platform/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      return await getNotifications();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationsReadThunk = createAsyncThunk(
  'platform/markNotificationsRead',
  async ({ userId, notificationId }, { rejectWithValue }) => {
    try {
      return await markNotificationsRead(userId, notificationId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to mark notifications read');
    }
  }
);

export const fetchAccountsThunk = createAsyncThunk(
  'platform/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      return await getAccounts();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch accounts');
    }
  }
);

export const fetchActivityLogsThunk = createAsyncThunk(
  'platform/fetchActivityLogs',
  async (userId, { rejectWithValue }) => {
    try {
      return await getActivityLogs(userId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch activity logs');
    }
  }
);

export const fetchArbitratorApplicationsThunk = createAsyncThunk(
  'platform/fetchArbitratorApplications',
  async (_, { rejectWithValue }) => {
    try {
      return await getArbitratorApplications();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch arbitrator applications');
    }
  }
);

export const submitArbitratorApplicationThunk = createAsyncThunk(
  'platform/submitArbitratorApplication',
  async (values, { rejectWithValue }) => {
    try {
      return await submitArbitratorApplication(values);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to submit arbitrator application');
    }
  }
);

export const approveArbitratorApplicationThunk = createAsyncThunk(
  'platform/approveArbitratorApplication',
  async (id, { rejectWithValue }) => {
    try {
      return await approveArbitratorApplication(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to approve arbitrator application');
    }
  }
);

export const rejectArbitratorApplicationThunk = createAsyncThunk(
  'platform/rejectArbitratorApplication',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      return await rejectArbitratorApplication(id, reason);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reject arbitrator application');
    }
  }
);

export const resetDemoDataThunk = createAsyncThunk(
  'platform/resetDemoData',
  async (_, { rejectWithValue }) => {
    try {
      return await resetDemoData();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to reset demo data');
    }
  }
);

export const createCustomJobRequestThunk = createAsyncThunk(
  'platform/createCustomJobRequest',
  async (values, { rejectWithValue }) => {
    try {
      return await createCustomJobRequest(values);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create custom job request');
    }
  }
);

export const fetchCustomJobRequestsThunk = createAsyncThunk(
  'platform/fetchCustomJobRequests',
  async (_, { rejectWithValue }) => {
    try {
      return await getCustomJobRequests();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch custom job requests');
    }
  }
);

const initialState = {
  notifications: [],
  accounts: [],
  activityLogs: [],
  arbitratorApplications: [],
  customJobRequests: [],
  loading: false,
  error: null,
};

const platformSlice = createSlice({
  name: 'platform',
  initialState,
  reducers: {
    clearPlatformError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload || [];
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // markNotificationsRead
      .addCase(markNotificationsReadThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload || [];
      })
      .addCase(markNotificationsReadThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchAccounts
      .addCase(fetchAccountsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload || [];
      })
      .addCase(fetchAccountsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchActivityLogs
      .addCase(fetchActivityLogsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityLogsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.activityLogs = action.payload || [];
      })
      .addCase(fetchActivityLogsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchArbitratorApplications
      .addCase(fetchArbitratorApplicationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArbitratorApplicationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.arbitratorApplications = action.payload || [];
      })
      .addCase(fetchArbitratorApplicationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // submitArbitratorApplication
      .addCase(submitArbitratorApplicationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitArbitratorApplicationThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.arbitratorApplications.unshift(action.payload);
        }
      })
      .addCase(submitArbitratorApplicationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // approveArbitratorApplication
      .addCase(approveArbitratorApplicationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveArbitratorApplicationThunk.fulfilled, (state, action) => {
        state.loading = false;
        const app = action.payload;
        if (app && app.id) {
          const idx = state.arbitratorApplications.findIndex((a) => a.id === app.id);
          if (idx !== -1) {
            state.arbitratorApplications[idx] = app;
          }
        }
      })
      .addCase(approveArbitratorApplicationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // rejectArbitratorApplication
      .addCase(rejectArbitratorApplicationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectArbitratorApplicationThunk.fulfilled, (state, action) => {
        state.loading = false;
        const app = action.payload;
        if (app && app.id) {
          const idx = state.arbitratorApplications.findIndex((a) => a.id === app.id);
          if (idx !== -1) {
            state.arbitratorApplications[idx] = app;
          }
        }
      })
      .addCase(rejectArbitratorApplicationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // resetDemoData
      .addCase(resetDemoDataThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetDemoDataThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetDemoDataThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createCustomJobRequest
      .addCase(createCustomJobRequestThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomJobRequestThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.customJobRequests.unshift(action.payload);
        }
      })
      .addCase(createCustomJobRequestThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchCustomJobRequests
      .addCase(fetchCustomJobRequestsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomJobRequestsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.customJobRequests = action.payload || [];
      })
      .addCase(fetchCustomJobRequestsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // logout reset
      .addCase(logoutThunk.fulfilled, (state) => {
        state.notifications = [];
        state.accounts = [];
        state.activityLogs = [];
        state.arbitratorApplications = [];
        state.customJobRequests = [];
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearPlatformError } = platformSlice.actions;

export const selectNotifications = (state) => state.platform.notifications;
export const selectUnreadCount = (state) =>
  (state.platform.notifications || []).filter((n) => !n.read).length;
export const selectAccounts = (state) => state.platform.accounts;
export const selectActivityLogs = (state) => state.platform.activityLogs;
export const selectArbitratorApplications = (state) =>
  state.platform.arbitratorApplications;
export const selectCustomJobRequests = (state) => state.platform.customJobRequests;
export const selectPlatformLoading = (state) => state.platform.loading;
export const selectPlatformError = (state) => state.platform.error;

export default platformSlice.reducer;
