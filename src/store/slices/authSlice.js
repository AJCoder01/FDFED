import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { authRepository } from '../../repositories/authRepository.js';
import { getAccessToken, setAccessToken } from '../../repositories/apiClient.js';

export const isSuperUserAccount = (user) =>
  Boolean(
    user &&
      user.role === 'admin' &&
      (user.isSuperUser === true ||
        user.email?.toLowerCase() === 'admin@gmail.com' ||
        user.id === 'user-admin-1') &&
      user.id !== 'user-admin-2' &&
      user.email?.toLowerCase() !== 'staffadmin@gmail.com',
  );

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authRepository.login(credentials);
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
  } catch (error) {
    return rejectWithValue(error.message || 'Login failed.');
  }
});

export const signupUser = createAsyncThunk('auth/signup', async (userData, { rejectWithValue }) => {
  try {
    const res = await authRepository.signup(userData);
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
  } catch (error) {
    return rejectWithValue(error.message || 'Signup failed.');
  }
});

export const fetchSession = createAsyncThunk('auth/fetchSession', async (_, { rejectWithValue }) => {
  try {
    const token = getAccessToken();
    if (!token) return null;
    const user = await authRepository.fetchSession();
    return user;
  } catch (error) {
    setAccessToken(null);
    return rejectWithValue(error.message || 'Session expired.');
  }
});

export const updateAuthSessionUser = createAsyncThunk('auth/updateSession', async (_, { rejectWithValue }) => {
  try {
    const token = getAccessToken();
    if (!token) return null;
    return await authRepository.fetchSession();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to refresh session.');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authRepository.logout();
    setAccessToken(null);
    return { success: true };
  } catch (error) {
    setAccessToken(null);
    return rejectWithValue(error.message || 'Logout failed.');
  }
});

export const switchDemoRole = createAsyncThunk('auth/demoSwitch', async (targetRole, { rejectWithValue }) => {
  try {
    const res = await authRepository.demoSwitch(targetRole);
    setAccessToken(res.accessToken || null);
    return { ...res, targetRole };
  } catch (error) {
    return rejectWithValue(error.message || 'Role switch failed.');
  }
});

const initialState = {
  currentUser: null,
  currentRole: 'guest',
  accessToken: getAccessToken(),
  isSuperUser: false,
  isSuperUserDemoMode: false,
  savedIntent: null,
  hydrated: !getAccessToken(),
  loading: false,
  error: null,
  mutationStatus: 'idle',
  mutationError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSavedIntent(state, action) {
      state.savedIntent = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
      state.mutationError = null;
    },
    forceGuestState(state) {
      setAccessToken(null);
      state.currentUser = null;
      state.currentRole = 'guest';
      state.accessToken = null;
      state.isSuperUser = false;
      state.isSuperUserDemoMode = false;
      state.savedIntent = null;
      state.hydrated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.mutationStatus = 'loading';
        state.error = null;
        state.mutationError = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { user, accessToken } = action.payload;
        const isSuper = isSuperUserAccount(user);
        state.loading = false;
        state.mutationStatus = 'succeeded';
        state.hydrated = true;
        state.accessToken = accessToken;
        state.currentUser = isSuper ? { ...user, isSuperUser: true } : user;
        state.currentRole = user?.role || 'guest';
        state.isSuperUser = isSuper;
        state.isSuperUserDemoMode = isSuper;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.mutationStatus = 'failed';
        state.error = action.payload;
        state.mutationError = action.payload;
      })

      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.mutationStatus = 'loading';
        state.error = null;
        state.mutationError = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        const { user, accessToken } = action.payload;
        const isSuper = isSuperUserAccount(user);
        state.loading = false;
        state.mutationStatus = 'succeeded';
        state.hydrated = true;
        state.accessToken = accessToken;
        state.currentUser = user;
        state.currentRole = user?.role || 'guest';
        state.isSuperUser = isSuper;
        state.isSuperUserDemoMode = isSuper;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.mutationStatus = 'failed';
        state.error = action.payload;
        state.mutationError = action.payload;
      })

      .addCase(fetchSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.loading = false;
        state.hydrated = true;
        const user = action.payload;
        if (user) {
          const isSuper = isSuperUserAccount(user);
          state.currentUser = isSuper ? { ...user, isSuperUser: true } : user;
          state.currentRole = user.role;
          state.isSuperUser = isSuper;
          if (isSuper) state.isSuperUserDemoMode = true;
        } else {
          state.currentUser = null;
          state.currentRole = 'guest';
          state.isSuperUser = false;
        }
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.loading = false;
        state.hydrated = true;
        state.currentUser = null;
        state.currentRole = 'guest';
        state.accessToken = null;
        state.isSuperUser = false;
        state.error = action.payload;
      })

      .addCase(updateAuthSessionUser.fulfilled, (state, action) => {
        if (action.payload) {
          const isSuper = isSuperUserAccount(action.payload);
          state.currentUser = isSuper ? { ...action.payload, isSuperUser: true } : action.payload;
          state.currentRole = action.payload.role;
          state.isSuperUser = isSuper;
        }
      })

      .addCase(logoutUser.pending, (state) => {
        state.mutationStatus = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.mutationStatus = 'succeeded';
        state.currentUser = null;
        state.currentRole = 'guest';
        state.accessToken = null;
        state.isSuperUser = false;
        state.isSuperUserDemoMode = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
        state.currentUser = null;
        state.currentRole = 'guest';
        state.accessToken = null;
        state.isSuperUser = false;
        state.isSuperUserDemoMode = false;
      })

      .addCase(switchDemoRole.pending, (state) => {
        state.loading = true;
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(switchDemoRole.fulfilled, (state, action) => {
        state.loading = false;
        state.mutationStatus = 'succeeded';
        const { user, accessToken, targetRole } = action.payload;
        if (targetRole === 'guest' || !user) {
          state.currentUser = null;
          state.currentRole = 'guest';
          state.accessToken = null;
          state.isSuperUser = false;
          state.isSuperUserDemoMode = true;
        } else {
          const isSuper = isSuperUserAccount(user);
          state.currentUser = isSuper ? { ...user, isSuperUser: true } : user;
          state.currentRole = user.role;
          state.accessToken = accessToken;
          state.isSuperUser = isSuper;
          state.isSuperUserDemoMode = true;
        }
      })
      .addCase(switchDemoRole.rejected, (state, action) => {
        state.loading = false;
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      // Sync currentUser pessimistically when user/profile/address/provider thunks succeed
      .addMatcher(
        (action) =>
          [
            'users/updateProfile/fulfilled',
            'users/saveCustomerAddresses/fulfilled',
          ].includes(action.type),
        (state, action) => {
          const updated = action.payload;
          if (updated && state.currentUser?.id === updated.id) {
            state.currentUser = { ...state.currentUser, ...updated };
          }
        },
      )
      .addMatcher(
        (action) =>
          ['users/saveProvider/fulfilled', 'users/saveAvailability/fulfilled'].includes(action.type),
        (state, action) => {
          const provider = action.payload;
          if (provider && state.currentUser?.id === provider.id) {
            state.currentUser = { ...state.currentUser, ...provider };
          }
        },
      )
      .addMatcher(
        (action) =>
          [
            'finance/fetchWallet/fulfilled',
            'finance/topUpWallet/fulfilled',
            'finance/withdrawWallet/fulfilled',
          ].includes(action.type),
        (state, action) => {
          if (state.currentUser && action.payload?.walletBalance !== undefined) {
            state.currentUser = {
              ...state.currentUser,
              walletBalance: action.payload.walletBalance,
            };
          }
        },
      )
      .addMatcher(
        (action) => action.type === 'platform/resetDemo/fulfilled',
        (state) => {
          setAccessToken(null);
          state.currentUser = null;
          state.currentRole = 'guest';
          state.accessToken = null;
          state.isSuperUser = false;
          state.isSuperUserDemoMode = false;
          state.savedIntent = null;
        },
      );
  },
});

export const { setSavedIntent, clearAuthError, forceGuestState } = authSlice.actions;

const selectAuthSlice = (state) => state.auth;
export const selectCurrentUser = createSelector(selectAuthSlice, (s) => s.currentUser);
export const selectCurrentRole = createSelector(selectAuthSlice, (s) => s.currentRole);
export const selectIsSuperUser = createSelector(selectAuthSlice, (s) => s.isSuperUser);
export const selectIsSuperUserDemoMode = createSelector(selectAuthSlice, (s) => s.isSuperUserDemoMode);
export const selectSavedIntent = createSelector(selectAuthSlice, (s) => s.savedIntent);
export const selectAuthHydrated = createSelector(selectAuthSlice, (s) => s.hydrated);
export const selectAuthLoading = createSelector(selectAuthSlice, (s) => s.loading);
export const selectAuthError = createSelector(selectAuthSlice, (s) => s.error);

export default authSlice.reducer;
