import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  proposeBookingTime,
  respondToTimeProposal,
  submitReview,
  replyToReview,
} from "../../data/apiRepository.js";
import { logoutThunk } from "./authSlice.js";

export const fetchBookingsThunk = createAsyncThunk(
  "bookings/fetchBookings",
  async (_, { rejectWithValue }) => {
    try {
      return await getBookings();
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch bookings");
    }
  }
);

export const fetchBookingByIdThunk = createAsyncThunk(
  "bookings/fetchBookingById",
  async (arg, { rejectWithValue }) => {
    try {
      const id = typeof arg === "object" && arg !== null ? (arg.id || arg.bookingId) : arg;
      return await getBookingById(id);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch booking");
    }
  }
);

export const createBookingThunk = createAsyncThunk(
  "bookings/createBooking",
  async (values, { rejectWithValue }) => {
    try {
      return await createBooking(values);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create booking");
    }
  }
);

export const updateBookingStatusThunk = createAsyncThunk(
  "bookings/updateBookingStatus",
  async (arg, { rejectWithValue }) => {
    try {
      const id = arg.id || arg.bookingId;
      const status = arg.status;
      const note = arg.note || "";
      return await updateBookingStatus(id, status, note);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to update booking status");
    }
  }
);

export const proposeBookingTimeThunk = createAsyncThunk(
  "bookings/proposeBookingTime",
  async (arg, { rejectWithValue }) => {
    try {
      const id = arg.id || arg.bookingId;
      const date = arg.date;
      const slot = arg.slot;
      return await proposeBookingTime(id, date, slot);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to propose booking time");
    }
  }
);

export const respondToTimeProposalThunk = createAsyncThunk(
  "bookings/respondToTimeProposal",
  async (arg, { rejectWithValue }) => {
    try {
      const id = arg.id || arg.bookingId;
      const accept = arg.accept;
      return await respondToTimeProposal(id, accept);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to respond to proposal");
    }
  }
);

export const submitReviewThunk = createAsyncThunk(
  "bookings/submitReview",
  async (arg, { rejectWithValue }) => {
    try {
      const id = arg.id || arg.bookingId;
      return await submitReview(id, arg.rating, arg.comment);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to submit review");
    }
  }
);

export const replyToReviewThunk = createAsyncThunk(
  "bookings/replyToReview",
  async (arg, { rejectWithValue }) => {
    try {
      const id = arg.id || arg.reviewId;
      return await replyToReview(id, arg.reply);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to reply to review");
    }
  }
);

const initialState = {
  items: [],
  selectedBooking: null,
  loading: false,
  error: null,
};

function updateBookingInState(state, updated) {
  if (!updated || !updated.id) return;
  const index = state.items.findIndex((b) => b.id === updated.id);
  if (index !== -1) {
    state.items[index] = { ...state.items[index], ...updated };
  } else {
    state.items.unshift(updated);
  }
  if (state.selectedBooking?.id === updated.id) {
    state.selectedBooking = { ...state.selectedBooking, ...updated };
  }
}

const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    clearBookingsError(state) {
      state.error = null;
    },
    clearSelectedBooking(state) {
      state.selectedBooking = null;
    },
    syncLocalBooking(state, action) {
      updateBookingInState(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBookings
      .addCase(fetchBookingsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBookingsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // fetchBookingById
      .addCase(fetchBookingByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBooking = action.payload;
        // Also sync into items if present
        const index = state.items.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchBookingByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // createBooking (Pessimistic: update only on fulfilled)
      .addCase(createBookingThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBookingThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.selectedBooking = action.payload;
      })
      .addCase(createBookingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // updateBookingStatus
      .addCase(updateBookingStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBookingStatusThunk.fulfilled, (state, action) => {
        state.loading = false;
        updateBookingInState(state, action.payload);
      })
      .addCase(updateBookingStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // proposeBookingTime
      .addCase(proposeBookingTimeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(proposeBookingTimeThunk.fulfilled, (state, action) => {
        state.loading = false;
        updateBookingInState(state, action.payload);
      })
      .addCase(proposeBookingTimeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // respondToTimeProposal
      .addCase(respondToTimeProposalThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToTimeProposalThunk.fulfilled, (state, action) => {
        state.loading = false;
        updateBookingInState(state, action.payload);
      })
      .addCase(respondToTimeProposalThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // submitReview
      .addCase(submitReviewThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitReviewThunk.fulfilled, (state, action) => {
        state.loading = false;
        updateBookingInState(state, action.payload);
      })
      .addCase(submitReviewThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // replyToReview
      .addCase(replyToReviewThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(replyToReviewThunk.fulfilled, (state, action) => {
        state.loading = false;
        updateBookingInState(state, action.payload);
      })
      .addCase(replyToReviewThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Reset on logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.items = [];
        state.selectedBooking = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearBookingsError, clearSelectedBooking, syncLocalBooking } =
  bookingsSlice.actions;

export const selectBookings = (state) => state.bookings.items;
export const selectSelectedBooking = (state) =>
  state.bookings.selectedBooking;
export const selectBookingsLoading = (state) => state.bookings.loading;
export const selectBookingsError = (state) => state.bookings.error;

export default bookingsSlice.reducer;
