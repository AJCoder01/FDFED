import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  authenticateUser,
  signUpUser,
  logoutUser,
  switchDemoRole,
  getUserProfile,
} from "../../data/apiRepository.js";
import { refreshSession } from "../../data/apiClient.js";

export const restoreSessionThunk = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      const user = await refreshSession();
      return user;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to restore session");
    }
  }
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password, role }, { rejectWithValue }) => {
    try {
      const user = await authenticateUser(email, password, role);
      return user;
    } catch (err) {
      return rejectWithValue(err.message || "Login failed");
    }
  }
);

export const signupThunk = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const user = await signUpUser(userData);
      return user;
    } catch (err) {
      return rejectWithValue(err.message || "Signup failed");
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutUser();
      return null;
    } catch (err) {
      return rejectWithValue(err.message || "Logout failed");
    }
  }
);

export const switchDemoRoleThunk = createAsyncThunk(
  "auth/switchDemoRole",
  async (role, { rejectWithValue }) => {
    try {
      const user = await switchDemoRole(role);
      return user;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to switch role");
    }
  }
);

export const fetchCurrentUserThunk = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const profile = await getUserProfile();
      return profile;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch user profile");
    }
  }
);

const initialState = {
  user: null,
  authLoading: true,
  authError: "",
  savedIntent: null,
  status: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSavedIntent(state, action) {
      state.savedIntent = action.payload;
    },
    clearSavedIntent(state) {
      state.savedIntent = null;
    },
    clearAuthError(state) {
      state.authError = "";
    },
    setUser(state, action) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // restoreSession
      .addCase(restoreSessionThunk.pending, (state) => {
        state.authLoading = true;
        state.authError = "";
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.authLoading = false;
        state.authError = "";
        state.status = "succeeded";
      })
      .addCase(restoreSessionThunk.rejected, (state) => {
        state.user = null;
        state.authLoading = false;
        state.authError = "";
        state.status = "idle";
      })
      // login
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.authError = "";
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "succeeded";
        state.authError = "";
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload || action.error.message || "Login failed";
      })
      // signup
      .addCase(signupThunk.pending, (state) => {
        state.status = "loading";
        state.authError = "";
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "succeeded";
        state.authError = "";
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload || action.error.message || "Signup failed";
      })
      // logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.savedIntent = null;
        state.status = "idle";
        state.authError = "";
        state.authLoading = false;
      })
      // switchDemoRole
      .addCase(switchDemoRoleThunk.pending, (state) => {
        state.status = "loading";
        state.authError = "";
      })
      .addCase(switchDemoRoleThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "succeeded";
        state.authError = "";
      })
      .addCase(switchDemoRoleThunk.rejected, (state, action) => {
        state.status = "failed";
        state.authError = action.payload || action.error.message || "";
      })
      // fetchCurrentUser
      .addCase(fetchCurrentUserThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { setSavedIntent, clearSavedIntent, clearAuthError, setUser } =
  authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectCurrentRole = (state) => state.auth.user?.role || "guest";
export const selectAuthLoading = (state) => state.auth.authLoading;
export const selectAuthError = (state) => state.auth.authError;
export const selectSavedIntent = (state) => state.auth.savedIntent;
export const selectIsSuperUser = (state) =>
  state.auth.user?.role === "admin" && state.auth.user?.isSuperUser === true;
export const selectIsSuperUserDemoMode = (state) =>
  !!state.auth.user?.canDemoSwitch;

export default authSlice.reducer;
