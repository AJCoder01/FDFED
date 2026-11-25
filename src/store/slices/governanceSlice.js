import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { governanceRepository } from '../../repositories/governanceRepository.js';

export const fetchTickets = createAsyncThunk('governance/fetchTickets', async (params = {}, { rejectWithValue }) => {
  try {
    return await governanceRepository.fetchTickets(params);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load support tickets.');
  }
});

export const createTicket = createAsyncThunk('governance/createTicket', async (values, { rejectWithValue }) => {
  try {
    return await governanceRepository.createTicket(values);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to create ticket.');
  }
});

export const resolveTicket = createAsyncThunk('governance/resolveTicket', async (payload, { rejectWithValue }) => {
  try {
    return await governanceRepository.resolveTicket(payload);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to resolve ticket.');
  }
});

export const deleteTicket = createAsyncThunk('governance/deleteTicket', async (ticketId, { rejectWithValue }) => {
  try {
    await governanceRepository.deleteTicket(ticketId);
    return ticketId;
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to delete ticket.');
  }
});

export const fetchDisputes = createAsyncThunk('governance/fetchDisputes', async (_, { rejectWithValue }) => {
  try {
    return await governanceRepository.fetchDisputes();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load disputes.');
  }
});

export const fetchDisputeById = createAsyncThunk('governance/fetchDisputeById', async (disputeId, { rejectWithValue }) => {
  try {
    return await governanceRepository.fetchDisputeById(disputeId);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load dispute.');
  }
});

export const createDispute = createAsyncThunk('governance/createDispute', async (values, { rejectWithValue }) => {
  try {
    return await governanceRepository.createDispute(values);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to file dispute.');
  }
});

export const assignDispute = createAsyncThunk('governance/assignDispute', async (payload, { rejectWithValue }) => {
  try {
    return await governanceRepository.assignDispute(payload);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to assign arbitrator.');
  }
});

export const saveDisputeResponse = createAsyncThunk(
  'governance/saveDisputeResponse',
  async (payload, { rejectWithValue }) => {
    try {
      return await governanceRepository.saveDisputeResponse(payload);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to save dispute response.');
    }
  },
);

export const scheduleHearing = createAsyncThunk('governance/scheduleHearing', async (payload, { rejectWithValue }) => {
  try {
    return await governanceRepository.scheduleHearing(payload);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to schedule hearing.');
  }
});

export const issueRuling = createAsyncThunk('governance/issueRuling', async (payload, { rejectWithValue }) => {
  try {
    return await governanceRepository.issueRuling(payload);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to issue ruling.');
  }
});

export const deleteDispute = createAsyncThunk('governance/deleteDispute', async (disputeId, { rejectWithValue }) => {
  try {
    await governanceRepository.deleteDispute(disputeId);
    return disputeId;
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to delete dispute.');
  }
});

export const fetchArbitratorApplications = createAsyncThunk(
  'governance/fetchArbitratorApplications',
  async (_, { rejectWithValue }) => {
    try {
      return await governanceRepository.fetchArbitratorApplications();
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to load arbitrator applications.');
    }
  },
);

export const submitArbitratorApplication = createAsyncThunk(
  'governance/submitArbitratorApplication',
  async (values, { rejectWithValue }) => {
    try {
      return await governanceRepository.submitArbitratorApplication(values);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to submit application.');
    }
  },
);

export const approveArbitratorApplication = createAsyncThunk(
  'governance/approveArbitratorApplication',
  async (applicationId, { rejectWithValue }) => {
    try {
      return await governanceRepository.approveArbitratorApplication(applicationId);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to approve application.');
    }
  },
);

export const rejectArbitratorApplication = createAsyncThunk(
  'governance/rejectArbitratorApplication',
  async (payload, { rejectWithValue }) => {
    try {
      return await governanceRepository.rejectArbitratorApplication(payload);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to reject application.');
    }
  },
);

export const deleteArbitratorApplication = createAsyncThunk(
  'governance/deleteArbitratorApplication',
  async (applicationId, { rejectWithValue }) => {
    try {
      await governanceRepository.deleteArbitratorApplication(applicationId);
      return applicationId;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to delete application.');
    }
  },
);

const upsertById = (list, item) => {
  if (!item?.id) return list;
  const idx = list.findIndex((entry) => entry.id === item.id);
  if (idx === -1) return [item, ...list];
  const next = [...list];
  next[idx] = item;
  return next;
};

const governanceSlice = createSlice({
  name: 'governance',
  initialState: {
    tickets: [],
    disputes: [],
    selectedDispute: null,
    arbitratorApplications: [],
    loading: false,
    error: null,
    mutationStatus: 'idle',
    mutationError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload || [];
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createTicket.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.tickets = upsertById(state.tickets, action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(resolveTicket.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(resolveTicket.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.tickets = upsertById(state.tickets, action.payload);
      })
      .addCase(resolveTicket.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.tickets = state.tickets.filter((t) => t.id !== action.payload);
      })

      .addCase(fetchDisputes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDisputes.fulfilled, (state, action) => {
        state.loading = false;
        state.disputes = action.payload || [];
      })
      .addCase(fetchDisputes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchDisputeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDisputeById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDispute = action.payload;
        state.disputes = upsertById(state.disputes, action.payload);
      })
      .addCase(fetchDisputeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createDispute.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createDispute.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.selectedDispute = action.payload;
        state.disputes = upsertById(state.disputes, action.payload);
      })
      .addCase(createDispute.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(assignDispute.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.disputes = upsertById(state.disputes, action.payload);
        if (state.selectedDispute?.id === action.payload?.id) state.selectedDispute = action.payload;
      })
      .addCase(saveDisputeResponse.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.disputes = upsertById(state.disputes, action.payload);
        if (state.selectedDispute?.id === action.payload?.id) state.selectedDispute = action.payload;
      })
      .addCase(scheduleHearing.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.disputes = upsertById(state.disputes, action.payload);
        if (state.selectedDispute?.id === action.payload?.id) state.selectedDispute = action.payload;
      })
      .addCase(issueRuling.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.disputes = upsertById(state.disputes, action.payload);
        if (state.selectedDispute?.id === action.payload?.id) state.selectedDispute = action.payload;
      })
      .addCase(deleteDispute.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.disputes = state.disputes.filter((d) => d.id !== action.payload);
        if (state.selectedDispute?.id === action.payload) state.selectedDispute = null;
      })

      .addCase(fetchArbitratorApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArbitratorApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.arbitratorApplications = action.payload || [];
      })
      .addCase(fetchArbitratorApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(submitArbitratorApplication.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(submitArbitratorApplication.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.arbitratorApplications = upsertById(state.arbitratorApplications, action.payload);
      })
      .addCase(submitArbitratorApplication.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(approveArbitratorApplication.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.arbitratorApplications = upsertById(state.arbitratorApplications, action.payload);
      })
      .addCase(rejectArbitratorApplication.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.arbitratorApplications = upsertById(state.arbitratorApplications, action.payload);
      })
      .addCase(deleteArbitratorApplication.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.arbitratorApplications = state.arbitratorApplications.filter((a) => a.id !== action.payload);
      });
  },
});

const selectGovernanceSlice = (state) => state.governance;
export const selectTickets = createSelector(selectGovernanceSlice, (s) => s.tickets);
export const selectDisputes = createSelector(selectGovernanceSlice, (s) => s.disputes);
export const selectSelectedDispute = createSelector(selectGovernanceSlice, (s) => s.selectedDispute);
export const selectArbitratorApplications = createSelector(selectGovernanceSlice, (s) => s.arbitratorApplications);
export const selectGovernanceLoading = createSelector(selectGovernanceSlice, (s) => s.loading);
export const selectGovernanceError = createSelector(selectGovernanceSlice, (s) => s.error);

export default governanceSlice.reducer;
