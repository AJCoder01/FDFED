import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { platformRepository } from '../../repositories/platformRepository.js';

export const fetchPlatformStats = createAsyncThunk('platform/fetchStats', async (_, { rejectWithValue }) => {
  try {
    return await platformRepository.fetchStats();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load platform stats.');
  }
});

export const fetchActivityLogs = createAsyncThunk('platform/fetchActivityLogs', async (userId, { rejectWithValue }) => {
  try {
    return await platformRepository.fetchActivityLogs(userId);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load activity logs.');
  }
});

export const createActivityLog = createAsyncThunk('platform/createActivityLog', async (entry, { rejectWithValue }) => {
  try {
    return await platformRepository.createActivityLog(entry);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to create activity log.');
  }
});

export const updateActivityLog = createAsyncThunk(
  'platform/updateActivityLog',
  async (payload, { rejectWithValue }) => {
    try {
      return await platformRepository.updateActivityLog(payload);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to update activity log.');
    }
  },
);

export const deleteActivityLog = createAsyncThunk('platform/deleteActivityLog', async (id, { rejectWithValue }) => {
  try {
    await platformRepository.deleteActivityLog(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to delete activity log.');
  }
});

export const resetDemoData = createAsyncThunk('platform/resetDemo', async (_, { rejectWithValue }) => {
  try {
    return await platformRepository.resetDemo();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to reset demo database.');
  }
});

const platformSlice = createSlice({
  name: 'platform',
  initialState: {
    stats: null,
    activityLogs: [],
    loading: false,
    error: null,
    mutationStatus: 'idle',
    mutationError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlatformStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlatformStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchPlatformStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchActivityLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.activityLogs = action.payload || [];
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createActivityLog.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createActivityLog.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.activityLogs = [action.payload, ...state.activityLogs];
      })
      .addCase(createActivityLog.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(updateActivityLog.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const idx = state.activityLogs.findIndex((l) => l.id === action.payload?.id);
        if (idx !== -1) state.activityLogs[idx] = action.payload;
      })

      .addCase(deleteActivityLog.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.activityLogs = state.activityLogs.filter((l) => l.id !== action.payload);
      })

      .addCase(resetDemoData.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(resetDemoData.fulfilled, (state) => {
        state.mutationStatus = 'succeeded';
        state.activityLogs = [];
        state.stats = null;
      })
      .addCase(resetDemoData.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      });
  },
});

const selectPlatformSlice = (state) => state.platform;
export const selectPlatformStats = createSelector(selectPlatformSlice, (s) => s.stats);
export const selectActivityLogs = createSelector(selectPlatformSlice, (s) => s.activityLogs);
export const selectPlatformLoading = createSelector(selectPlatformSlice, (s) => s.loading);
export const selectPlatformError = createSelector(selectPlatformSlice, (s) => s.error);

export default platformSlice.reducer;
