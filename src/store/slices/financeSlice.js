import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getRevenueStats } from "../../data/apiRepository.js";
import { logoutThunk } from "./authSlice.js";

export const fetchRevenueStatsThunk = createAsyncThunk(
  "finance/fetchRevenueStats",
  async (_, { rejectWithValue }) => {
    try {
      return await getRevenueStats();
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch revenue stats");
    }
  }
);

const initialState = {
  revenueStats: {
    totalRevenue: 0,
    gmv: 0,
    netPayouts: 0,
  },
  loading: false,
  error: null,
};

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    clearFinanceError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevenueStatsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenueStatsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueStats = action.payload;
      })
      .addCase(fetchRevenueStatsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.revenueStats = { totalRevenue: 0, gmv: 0, netPayouts: 0 };
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearFinanceError } = financeSlice.actions;

export const selectRevenueStats = (state) => state.finance.revenueStats;
export const selectFinanceLoading = (state) => state.finance.loading;
export const selectFinanceError = (state) => state.finance.error;

export default financeSlice.reducer;
