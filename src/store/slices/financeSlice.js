import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { financeRepository } from '../../repositories/financeRepository.js';

export const fetchWallet = createAsyncThunk('finance/fetchWallet', async (_, { rejectWithValue }) => {
  try {
    return await financeRepository.fetchWallet();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load wallet.');
  }
});

export const topUpWallet = createAsyncThunk('finance/topUpWallet', async (payload, { rejectWithValue }) => {
  try {
    return await financeRepository.topUpWallet(payload);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to top up wallet.');
  }
});

export const withdrawWallet = createAsyncThunk('finance/withdrawWallet', async (payload, { rejectWithValue }) => {
  try {
    return await financeRepository.withdrawWallet(payload);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to process withdrawal.');
  }
});

export const fetchRevenueStats = createAsyncThunk('finance/fetchRevenueStats', async (_, { rejectWithValue }) => {
  try {
    return await financeRepository.fetchRevenueStats();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load revenue stats.');
  }
});

export const fetchLedgers = createAsyncThunk('finance/fetchLedgers', async (_, { rejectWithValue }) => {
  try {
    return await financeRepository.fetchLedgers();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load payment ledgers.');
  }
});

export const fetchProviderEarnings = createAsyncThunk(
  'finance/fetchProviderEarnings',
  async (providerId, { rejectWithValue }) => {
    try {
      return await financeRepository.fetchProviderEarnings(providerId);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to load provider earnings.');
    }
  },
);

export const createLedger = createAsyncThunk('finance/createLedger', async (data, { rejectWithValue }) => {
  try {
    return await financeRepository.createLedger(data);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to create ledger.');
  }
});

export const updateLedger = createAsyncThunk('finance/updateLedger', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await financeRepository.updateLedger(id, data);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to update ledger.');
  }
});

export const issueRefund = createAsyncThunk('finance/issueRefund', async ({ bookingId, amount }, { rejectWithValue }) => {
  try {
    return await financeRepository.issueRefund({ bookingId, amount });
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to issue refund.');
  }
});

export const deleteLedger = createAsyncThunk('finance/deleteLedger', async (id, { rejectWithValue }) => {
  try {
    await financeRepository.deleteLedger(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to delete ledger.');
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

const financeSlice = createSlice({
  name: 'finance',
  initialState: {
    wallet: null,
    revenueStats: null,
    ledgers: [],
    providerEarnings: null,
    loading: false,
    error: null,
    mutationStatus: 'idle',
    mutationError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(topUpWallet.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(topUpWallet.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const { walletBalance, transaction } = action.payload;
        if (state.wallet) {
          state.wallet = {
            ...state.wallet,
            walletBalance,
            totalCredits: (state.wallet.totalCredits || 0) + (transaction?.amount || 0),
            transactions: [transaction, ...(state.wallet.transactions || [])],
          };
        } else {
          state.wallet = { walletBalance, transactions: transaction ? [transaction] : [] };
        }
      })
      .addCase(topUpWallet.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(withdrawWallet.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(withdrawWallet.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        const { walletBalance, transaction } = action.payload;
        if (state.wallet) {
          state.wallet = {
            ...state.wallet,
            walletBalance,
            totalWithdrawals: (state.wallet.totalWithdrawals || 0) + (transaction?.amount || 0),
            transactions: [transaction, ...(state.wallet.transactions || [])],
          };
        } else {
          state.wallet = { walletBalance, transactions: transaction ? [transaction] : [] };
        }
      })
      .addCase(withdrawWallet.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(fetchRevenueStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenueStats.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueStats = action.payload;
      })
      .addCase(fetchRevenueStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchLedgers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLedgers.fulfilled, (state, action) => {
        state.loading = false;
        state.ledgers = action.payload || [];
      })
      .addCase(fetchLedgers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProviderEarnings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderEarnings.fulfilled, (state, action) => {
        state.loading = false;
        state.providerEarnings = action.payload;
      })
      .addCase(fetchProviderEarnings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createLedger.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createLedger.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.ledgers = upsertById(state.ledgers, action.payload);
      })
      .addCase(createLedger.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(updateLedger.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(updateLedger.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.ledgers = upsertById(state.ledgers, action.payload);
      })
      .addCase(updateLedger.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(issueRefund.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(issueRefund.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.ledgers = upsertById(state.ledgers, action.payload);
      })
      .addCase(issueRefund.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(deleteLedger.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(deleteLedger.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.ledgers = state.ledgers.filter((l) => l.id !== action.payload);
      })
      .addCase(deleteLedger.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addMatcher(
        (action) => action.type === 'auth/logout/fulfilled' || action.type === 'platform/resetDemo/fulfilled' || action.type === 'auth/demoSwitch/fulfilled',
        (state) => {
          state.wallet = null;
          state.revenueStats = null;
          state.providerEarnings = null;
        },
      );
  },
});

const selectFinanceSlice = (state) => state.finance;
export const selectWallet = createSelector(selectFinanceSlice, (s) => s.wallet);
export const selectWalletBalance = createSelector(selectWallet, (w) => w?.walletBalance ?? 0);
export const selectWalletTransactions = createSelector(selectWallet, (w) => w?.transactions || []);
export const selectRevenueStats = createSelector(selectFinanceSlice, (s) => s.revenueStats);
export const selectLedgers = createSelector(selectFinanceSlice, (s) => s.ledgers);
export const selectProviderEarnings = createSelector(selectFinanceSlice, (s) => s.providerEarnings);
export const selectFinanceLoading = createSelector(selectFinanceSlice, (s) => s.loading);
export const selectFinanceError = createSelector(selectFinanceSlice, (s) => s.error);

export default financeSlice.reducer;
