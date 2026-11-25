import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { usersRepository } from '../../repositories/usersRepository.js';

export const fetchAccounts = createAsyncThunk('users/fetchAccounts', async (_, { rejectWithValue }) => {
  try {
    return await usersRepository.fetchAccounts();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load accounts.');
  }
});

export const createUserAccount = createAsyncThunk('users/createAccount', async (userData, { rejectWithValue }) => {
  try {
    const res = await usersRepository.createAccount(userData);
    return res.user || res;
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to create account.');
  }
});

export const fetchUserById = createAsyncThunk('users/fetchById', async (userId, { rejectWithValue }) => {
  try {
    return await usersRepository.fetchUserById(userId);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load user.');
  }
});

export const fetchProviders = createAsyncThunk('users/fetchProviders', async (_, { rejectWithValue }) => {
  try {
    return await usersRepository.fetchProviders();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load providers.');
  }
});

export const fetchProviderById = createAsyncThunk('users/fetchProviderById', async (providerId, { rejectWithValue }) => {
  try {
    return await usersRepository.fetchProviderById(providerId);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load provider.');
  }
});

export const fetchCustomerById = createAsyncThunk('users/fetchCustomerById', async (customerId, { rejectWithValue }) => {
  try {
    return await usersRepository.fetchCustomerById(customerId);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load customer.');
  }
});

export const updateUserProfile = createAsyncThunk('users/updateProfile', async ({ userId, updates }, { rejectWithValue }) => {
  try {
    return await usersRepository.updateProfile(userId, updates);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to update profile.');
  }
});

export const saveCustomerAddresses = createAsyncThunk(
  'users/saveCustomerAddresses',
  async ({ customerId, addresses }, { rejectWithValue }) => {
    try {
      return await usersRepository.saveCustomerAddresses(customerId, addresses);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to save addresses.');
    }
  },
);

export const saveProvider = createAsyncThunk(
  'users/saveProvider',
  async ({ providerId, values, submit = false }, { rejectWithValue }) => {
    try {
      return await usersRepository.saveProvider(providerId, values, submit);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to save provider profile.');
    }
  },
);

export const moderateProvider = createAsyncThunk(
  'users/moderateProvider',
  async ({ providerId, status, reason }, { rejectWithValue }) => {
    try {
      return await usersRepository.moderateProvider(providerId, status, reason);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to moderate provider.');
    }
  },
);

export const saveAvailability = createAsyncThunk(
  'users/saveAvailability',
  async ({ providerId, schedule }, { rejectWithValue }) => {
    try {
      return await usersRepository.saveAvailability(providerId, schedule);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to save availability.');
    }
  },
);

export const deleteUserAccount = createAsyncThunk('users/deleteAccount', async (userId, { rejectWithValue }) => {
  try {
    await usersRepository.deleteAccount(userId);
    return userId;
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to delete account.');
  }
});

const upsertById = (list, item) => {
  if (!item?.id) return list;
  const idx = list.findIndex((entry) => entry.id === item.id);
  if (idx === -1) return [item, ...list];
  const next = [...list];
  next[idx] = item;
  return next;
};

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    accounts: [],
    providers: [],
    selectedUser: null,
    selectedProvider: null,
    selectedCustomer: null,
    loading: false,
    error: null,
    mutationStatus: 'idle',
    mutationError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload || [];
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createUserAccount.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createUserAccount.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.accounts = upsertById(state.accounts, action.payload);
      })
      .addCase(createUserAccount.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
        state.accounts = upsertById(state.accounts, action.payload);
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProviders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviders.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = action.payload || [];
      })
      .addCase(fetchProviders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProviderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProvider = action.payload;
        state.providers = upsertById(state.providers, action.payload);
      })
      .addCase(fetchProviderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
        state.accounts = upsertById(state.accounts, action.payload);
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateUserProfile.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const updated = action.payload;
        state.accounts = upsertById(state.accounts, updated);
        if (state.selectedUser?.id === updated.id) state.selectedUser = updated;
        if (updated.role === 'customer') state.selectedCustomer = updated;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(saveCustomerAddresses.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(saveCustomerAddresses.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const updated = action.payload;
        state.selectedCustomer = updated;
        state.accounts = upsertById(state.accounts, updated);
      })
      .addCase(saveCustomerAddresses.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(saveProvider.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(saveProvider.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const updated = action.payload;
        state.selectedProvider = updated;
        state.providers = upsertById(state.providers, updated);
      })
      .addCase(saveProvider.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(moderateProvider.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(moderateProvider.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const updated = action.payload;
        state.selectedProvider = updated;
        state.providers = upsertById(state.providers, updated);
      })
      .addCase(moderateProvider.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(saveAvailability.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(saveAvailability.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const updated = action.payload;
        state.selectedProvider = updated;
        state.providers = upsertById(state.providers, updated);
      })
      .addCase(saveAvailability.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(deleteUserAccount.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.accounts = state.accounts.filter((a) => a.id !== action.payload);
        state.providers = state.providers.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      });
  },
});

const selectUsersSlice = (state) => state.users;
export const selectAccounts = createSelector(selectUsersSlice, (s) => s.accounts);
export const selectProviders = createSelector(selectUsersSlice, (s) => s.providers);
export const selectSelectedProvider = createSelector(selectUsersSlice, (s) => s.selectedProvider);
export const selectSelectedCustomer = createSelector(selectUsersSlice, (s) => s.selectedCustomer);
export const selectUsersLoading = createSelector(selectUsersSlice, (s) => s.loading);
export const selectUsersError = createSelector(selectUsersSlice, (s) => s.error);
export const selectUsersMutationStatus = createSelector(selectUsersSlice, (s) => s.mutationStatus);

export default usersSlice.reducer;
