import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { bookingsRepository } from '../../repositories/bookingsRepository.js';

export const fetchBookings = createAsyncThunk('bookings/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    return await bookingsRepository.fetchBookings(params);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load bookings.');
  }
});

export const fetchBookingById = createAsyncThunk('bookings/fetchById', async (bookingId, { rejectWithValue }) => {
  try {
    return await bookingsRepository.fetchBookingById(bookingId);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load booking.');
  }
});

export const fetchAvailableSlots = createAsyncThunk(
  'bookings/fetchAvailableSlots',
  async ({ serviceId, date, excludeId }, { rejectWithValue }) => {
    try {
      const slots = await bookingsRepository.fetchAvailableSlots({ serviceId, date, excludeId });
      return { key: `${serviceId}::${date}`, slots };
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to load available slots.');
    }
  },
);

export const createBooking = createAsyncThunk('bookings/create', async (values, { rejectWithValue }) => {
  try {
    return await bookingsRepository.createBooking(values);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to create booking.');
  }
});

export const updateBookingStatus = createAsyncThunk(
  'bookings/updateStatus',
  async ({ bookingId, status, note, expectedStatus }, { rejectWithValue }) => {
    try {
      return await bookingsRepository.updateBookingStatus({ bookingId, status, note, expectedStatus });
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to update booking status.');
    }
  },
);

export const proposeBookingTime = createAsyncThunk(
  'bookings/proposeTime',
  async ({ bookingId, date, slot }, { rejectWithValue }) => {
    try {
      return await bookingsRepository.proposeBookingTime({ bookingId, date, slot });
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to propose new time.');
    }
  },
);

export const respondToTimeProposal = createAsyncThunk(
  'bookings/respondTime',
  async ({ bookingId, accept }, { rejectWithValue }) => {
    try {
      return await bookingsRepository.respondToTimeProposal({ bookingId, accept });
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to respond to time proposal.');
    }
  },
);

export const deleteBooking = createAsyncThunk('bookings/delete', async (bookingId, { rejectWithValue }) => {
  try {
    await bookingsRepository.deleteBooking(bookingId);
    return bookingId;
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to delete booking.');
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

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    items: [],
    selectedBooking: null,
    slotsByKey: {},
    slotsLoading: false,
    loading: false,
    error: null,
    mutationStatus: 'idle',
    mutationError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBooking = action.payload;
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchAvailableSlots.pending, (state) => {
        state.slotsLoading = true;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.slotsLoading = false;
        state.slotsByKey[action.payload.key] = action.payload.slots || [];
      })
      .addCase(fetchAvailableSlots.rejected, (state) => {
        state.slotsLoading = false;
      })

      .addCase(createBooking.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.selectedBooking = action.payload;
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(updateBookingStatus.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items = upsertById(state.items, action.payload);
        if (state.selectedBooking?.id === action.payload?.id) state.selectedBooking = action.payload;
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(proposeBookingTime.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(proposeBookingTime.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items = upsertById(state.items, action.payload);
        if (state.selectedBooking?.id === action.payload?.id) state.selectedBooking = action.payload;
      })
      .addCase(proposeBookingTime.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(respondToTimeProposal.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(respondToTimeProposal.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items = upsertById(state.items, action.payload);
        if (state.selectedBooking?.id === action.payload?.id) state.selectedBooking = action.payload;
      })
      .addCase(respondToTimeProposal.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(deleteBooking.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(deleteBooking.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items = state.items.filter((b) => b.id !== action.payload);
        if (state.selectedBooking?.id === action.payload) state.selectedBooking = null;
      })
      .addCase(deleteBooking.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      // Sync booking when review is submitted/replied via marketplaceSlice
      .addMatcher(
        (action) =>
          ['marketplace/submitReview/fulfilled', 'marketplace/replyToReview/fulfilled'].includes(action.type),
        (state, action) => {
          const updated = action.payload;
          if (updated?.id) {
            state.items = upsertById(state.items, updated);
            if (state.selectedBooking?.id === updated.id) state.selectedBooking = updated;
          }
        },
      );
  },
});

const selectBookingsSlice = (state) => state.bookings;
export const selectBookings = createSelector(selectBookingsSlice, (s) => s.items);
export const selectSelectedBooking = createSelector(selectBookingsSlice, (s) => s.selectedBooking);
export const selectSlotsByKey = createSelector(selectBookingsSlice, (s) => s.slotsByKey);
export const selectSlotsLoading = createSelector(selectBookingsSlice, (s) => s.slotsLoading);
export const selectBookingsLoading = createSelector(selectBookingsSlice, (s) => s.loading);
export const selectBookingsError = createSelector(selectBookingsSlice, (s) => s.error);

export default bookingsSlice.reducer;
