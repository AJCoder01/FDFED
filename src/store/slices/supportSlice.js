import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getTickets,
  createTicket,
  resolveTicket,
  getDisputes,
  getDisputeById,
  createDispute,
  assignDispute,
  saveDisputeResponse,
  scheduleHearing,
  issueRuling,
} from "../../data/apiRepository.js";
import { logoutThunk } from "./authSlice.js";

export const fetchTicketsThunk = createAsyncThunk(
  "support/fetchTickets",
  async (_, { rejectWithValue }) => {
    try {
      return await getTickets();
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch tickets");
    }
  }
);

export const createTicketThunk = createAsyncThunk(
  "support/createTicket",
  async (values, { rejectWithValue }) => {
    try {
      return await createTicket(values);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create ticket");
    }
  }
);

export const resolveTicketThunk = createAsyncThunk(
  "support/resolveTicket",
  async ({ id, ticketId, outcome }, { rejectWithValue }) => {
    try {
      const targetId = id || ticketId;
      return await resolveTicket(targetId, outcome);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to resolve ticket");
    }
  }
);

export const fetchDisputesThunk = createAsyncThunk(
  "support/fetchDisputes",
  async (_, { rejectWithValue }) => {
    try {
      return await getDisputes();
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch disputes");
    }
  }
);

export const fetchDisputeByIdThunk = createAsyncThunk(
  "support/fetchDisputeById",
  async (id, { rejectWithValue }) => {
    try {
      return await getDisputeById(id);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch dispute");
    }
  }
);

export const createDisputeThunk = createAsyncThunk(
  "support/createDispute",
  async (values, { rejectWithValue }) => {
    try {
      return await createDispute(values);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create dispute");
    }
  }
);

export const assignDisputeThunk = createAsyncThunk(
  "support/assignDispute",
  async ({ id, disputeId, arbitrator, arbitratorData }, { rejectWithValue }) => {
    try {
      const targetId = id || disputeId;
      const data = arbitrator || arbitratorData;
      return await assignDispute(targetId, data);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to assign arbitrator");
    }
  }
);

export const saveDisputeResponseThunk = createAsyncThunk(
  "support/saveDisputeResponse",
  async ({ id, disputeId, providerId, statement, response, values, files }, { rejectWithValue }) => {
    try {
      const targetId = id || disputeId;
      const data = statement || response || values;
      return await saveDisputeResponse(targetId, providerId, data, files);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save dispute response");
    }
  }
);

export const scheduleHearingThunk = createAsyncThunk(
  "support/scheduleHearing",
  async ({ id, disputeId, values, hearingData }, { rejectWithValue }) => {
    try {
      const targetId = id || disputeId;
      const data = values || hearingData;
      return await scheduleHearing(targetId, data);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to schedule hearing");
    }
  }
);

export const issueRulingThunk = createAsyncThunk(
  "support/issueRuling",
  async ({ id, disputeId, values, rulingData }, { rejectWithValue }) => {
    try {
      const targetId = id || disputeId;
      const data = values || rulingData;
      return await issueRuling(targetId, data);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to issue ruling");
    }
  }
);

const initialState = {
  tickets: [],
  disputes: [],
  selectedDispute: null,
  loading: false,
  error: null,
};

function updateDisputeInState(state, updated) {
  if (!updated || !updated.id) return;
  const index = state.disputes.findIndex((d) => d.id === updated.id);
  if (index !== -1) {
    state.disputes[index] = { ...state.disputes[index], ...updated };
  } else {
    state.disputes.unshift(updated);
  }
  if (state.selectedDispute?.id === updated.id) {
    state.selectedDispute = { ...state.selectedDispute, ...updated };
  }
}

const supportSlice = createSlice({
  name: "support",
  initialState,
  reducers: {
    clearSupportError(state) {
      state.error = null;
    },
    clearSelectedDispute(state) {
      state.selectedDispute = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTickets
      .addCase(fetchTicketsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTicketsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // createTicket
      .addCase(createTicketThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicketThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicketThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // resolveTicket
      .addCase(resolveTicketThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveTicketThunk.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        if (updated?.id) {
          const index = state.tickets.findIndex((t) => t.id === updated.id);
          if (index !== -1) {
            state.tickets[index] = { ...state.tickets[index], ...updated };
          }
        }
      })
      .addCase(resolveTicketThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // fetchDisputes
      .addCase(fetchDisputesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDisputesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.disputes = action.payload;
      })
      .addCase(fetchDisputesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // fetchDisputeById
      .addCase(fetchDisputeByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDisputeByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDispute = action.payload;
        const index = state.disputes.findIndex(
          (d) => d.id === action.payload.id
        );
        if (index !== -1) {
          state.disputes[index] = action.payload;
        }
      })
      .addCase(fetchDisputeByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // createDispute
      .addCase(createDisputeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDisputeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.disputes.unshift(action.payload);
        state.selectedDispute = action.payload;
      })
      .addCase(createDisputeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // assignDispute
      .addCase(assignDisputeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignDisputeThunk.fulfilled, (state, action) => {
        state.loading = false;
        updateDisputeInState(state, action.payload);
      })
      .addCase(assignDisputeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // saveDisputeResponse
      .addCase(saveDisputeResponseThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveDisputeResponseThunk.fulfilled, (state, action) => {
        state.loading = false;
        updateDisputeInState(state, action.payload);
      })
      .addCase(saveDisputeResponseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // scheduleHearing
      .addCase(scheduleHearingThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(scheduleHearingThunk.fulfilled, (state, action) => {
        state.loading = false;
        updateDisputeInState(state, action.payload);
      })
      .addCase(scheduleHearingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // issueRuling
      .addCase(issueRulingThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(issueRulingThunk.fulfilled, (state, action) => {
        state.loading = false;
        updateDisputeInState(state, action.payload);
      })
      .addCase(issueRulingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Reset on logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.tickets = [];
        state.disputes = [];
        state.selectedDispute = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearSupportError, clearSelectedDispute } = supportSlice.actions;

export const selectTickets = (state) => state.support.tickets;
export const selectDisputes = (state) => state.support.disputes;
export const selectSelectedDispute = (state) => state.support.selectedDispute;
export const selectSupportLoading = (state) => state.support.loading;
export const selectSupportError = (state) => state.support.error;

export default supportSlice.reducer;
