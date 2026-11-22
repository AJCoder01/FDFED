import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getUserProfile,
  updateUserProfile,
  saveCustomerAddresses,
  getProviders,
  getProviderById,
  saveProvider,
  saveAvailability,
  moderateProvider,
} from "../../data/apiRepository.js";
import { logoutThunk } from "./authSlice.js";

export const fetchUserProfileThunk = createAsyncThunk(
  "users/fetchUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await getUserProfile();
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch profile");
    }
  }
);

export const updateUserProfileThunk = createAsyncThunk(
  "users/updateUserProfile",
  async ({ id, values }, { rejectWithValue }) => {
    try {
      return await updateUserProfile(id, values);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to update profile");
    }
  }
);

export const saveCustomerAddressesThunk = createAsyncThunk(
  "users/saveCustomerAddresses",
  async ({ id, addresses }, { rejectWithValue }) => {
    try {
      return await saveCustomerAddresses(id, addresses);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save addresses");
    }
  }
);

export const fetchProvidersThunk = createAsyncThunk(
  "users/fetchProviders",
  async (_, { rejectWithValue }) => {
    try {
      return await getProviders();
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch providers");
    }
  }
);

export const fetchProviderByIdThunk = createAsyncThunk(
  "users/fetchProviderById",
  async (id, { rejectWithValue }) => {
    try {
      return await getProviderById(id);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch provider");
    }
  }
);

export const saveProviderThunk = createAsyncThunk(
  "users/saveProvider",
  async ({ id, values, submit = false }, { rejectWithValue }) => {
    try {
      return await saveProvider(id, values, submit);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save provider");
    }
  }
);

export const saveAvailabilityThunk = createAsyncThunk(
  "users/saveAvailability",
  async ({ id, schedule }, { rejectWithValue }) => {
    try {
      return await saveAvailability(id, schedule);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save availability");
    }
  }
);

export const moderateProviderThunk = createAsyncThunk(
  "users/moderateProvider",
  async ({ id, providerId, status, reason }, { rejectWithValue }) => {
    try {
      const targetId = id || providerId;
      return await moderateProvider(targetId, status, reason);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to moderate provider");
    }
  }
);

const initialState = {
  profile: null,
  providers: [],
  selectedProvider: null,
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUserProfile
      .addCase(fetchUserProfileThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // updateUserProfile
      .addCase(updateUserProfileThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // saveCustomerAddresses
      .addCase(saveCustomerAddressesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveCustomerAddressesThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.addresses =
            action.payload.addresses || action.payload;
        }
      })
      .addCase(saveCustomerAddressesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // fetchProviders
      .addCase(fetchProvidersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProvidersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = action.payload;
      })
      .addCase(fetchProvidersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // fetchProviderById
      .addCase(fetchProviderByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProvider = action.payload;
      })
      .addCase(fetchProviderByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // saveProvider
      .addCase(saveProviderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveProviderThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        const index = state.providers.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          state.providers[index] = action.payload;
        }
      })
      .addCase(saveProviderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // saveAvailability
      .addCase(saveAvailabilityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveAvailabilityThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile = action.payload;
        }
      })
      .addCase(saveAvailabilityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // moderateProvider
      .addCase(moderateProviderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(moderateProviderThunk.fulfilled, (state, action) => {
        state.loading = false;
        const targetId = action.meta.arg.id || action.meta.arg.providerId;
        const index = state.providers.findIndex(
          (p) => p.id === targetId || (action.payload && p.id === action.payload.id)
        );
        if (index !== -1) {
          state.providers[index] = {
            ...state.providers[index],
            verificationStatus: action.meta.arg.status,
            ...(action.payload || {}),
          };
        }
      })
      .addCase(moderateProviderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Reset on logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.profile = null;
        state.providers = [];
        state.selectedProvider = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearUserError } = usersSlice.actions;

export const selectUserProfile = (state) => state.users.profile;
export const selectProviders = (state) => state.users.providers;
export const selectSelectedProvider = (state) => state.users.selectedProvider;
export const selectUsersLoading = (state) => state.users.loading;
export const selectUsersError = (state) => state.users.error;

export default usersSlice.reducer;
