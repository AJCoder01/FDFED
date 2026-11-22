import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCategories,
  getServices,
  getServiceById,
  saveService,
  deleteService,
  getAvailableSlots,
  getServiceReviews,
} from "../../data/apiRepository.js";
import { logoutThunk } from "./authSlice.js";

export const fetchCategoriesThunk = createAsyncThunk(
  "marketplace/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      return await getCategories();
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch categories");
    }
  }
);

export const fetchServicesThunk = createAsyncThunk(
  "marketplace/fetchServices",
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await getServices(filters);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch services");
    }
  }
);

export const fetchServiceByIdThunk = createAsyncThunk(
  "marketplace/fetchServiceById",
  async (arg, { rejectWithValue }) => {
    try {
      const targetId = typeof arg === "object" && arg !== null ? (arg.id || arg.serviceId) : arg;
      return await getServiceById(targetId);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch service");
    }
  }
);

export const saveServiceThunk = createAsyncThunk(
  "marketplace/saveService",
  async (arg, { rejectWithValue }) => {
    try {
      const values = arg && arg.serviceData ? arg.serviceData : arg;
      return await saveService(values);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save service");
    }
  }
);

export const deleteServiceThunk = createAsyncThunk(
  "marketplace/deleteService",
  async (arg, { rejectWithValue }) => {
    try {
      const targetId = typeof arg === "object" && arg !== null ? (arg.id || arg.serviceId) : arg;
      await deleteService(targetId);
      return targetId;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete service");
    }
  }
);

export const fetchAvailableSlotsThunk = createAsyncThunk(
  "marketplace/fetchAvailableSlots",
  async (arg, { rejectWithValue }) => {
    try {
      const targetId = arg.id || arg.serviceId;
      return await getAvailableSlots(targetId, arg.date, arg.excludeId);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch slots");
    }
  }
);

export const fetchServiceReviewsThunk = createAsyncThunk(
  "marketplace/fetchServiceReviews",
  async (arg, { rejectWithValue }) => {
    try {
      const targetId = typeof arg === "object" && arg !== null ? (arg.id || arg.serviceId) : arg;
      return await getServiceReviews(targetId);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch reviews");
    }
  }
);

const initialState = {
  categories: [],
  services: [],
  selectedService: null,
  availableSlots: [],
  reviews: [],
  loading: false,
  error: null,
};

const marketplaceSlice = createSlice({
  name: "marketplace",
  initialState,
  reducers: {
    clearMarketplaceError(state) {
      state.error = null;
    },
    clearSelectedService(state) {
      state.selectedService = null;
      state.reviews = [];
      state.availableSlots = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCategories
      .addCase(fetchCategoriesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoriesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategoriesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // fetchServices
      .addCase(fetchServicesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServicesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchServicesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // fetchServiceById
      .addCase(fetchServiceByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedService = action.payload;
      })
      .addCase(fetchServiceByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // saveService
      .addCase(saveServiceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveServiceThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const saved = action.payload?.service || action.payload;
        if (saved?.id) {
          const index = state.services.findIndex((s) => s.id === saved.id);
          if (index !== -1) {
            state.services[index] = saved;
          } else {
            state.services.unshift(saved);
          }
          if (state.selectedService?.id === saved.id) {
            state.selectedService = saved;
          }
        }
      })
      .addCase(saveServiceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // deleteService
      .addCase(deleteServiceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteServiceThunk.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload;
        state.services = state.services.filter((s) => s.id !== id);
        if (state.selectedService?.id === id) {
          state.selectedService = null;
        }
      })
      .addCase(deleteServiceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // fetchAvailableSlots
      .addCase(fetchAvailableSlotsThunk.fulfilled, (state, action) => {
        state.availableSlots = action.payload;
      })
      .addCase(fetchAvailableSlotsThunk.rejected, (state, action) => {
        state.availableSlots = [];
        state.error = action.payload || action.error.message;
      })
      // fetchServiceReviews
      .addCase(fetchServiceReviewsThunk.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(fetchServiceReviewsThunk.rejected, (state, action) => {
        state.reviews = [];
        state.error = action.payload || action.error.message;
      })
      // Reset on logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.selectedService = null;
        state.availableSlots = [];
        state.reviews = [];
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearMarketplaceError, clearSelectedService } =
  marketplaceSlice.actions;

export const selectCategories = (state) => state.marketplace.categories;
export const selectServices = (state) => state.marketplace.services;
export const selectSelectedService = (state) =>
  state.marketplace.selectedService;
export const selectAvailableSlots = (state) =>
  state.marketplace.availableSlots;
export const selectServiceReviews = (state) => state.marketplace.reviews;
export const selectMarketplaceLoading = (state) => state.marketplace.loading;
export const selectMarketplaceError = (state) => state.marketplace.error;

export default marketplaceSlice.reducer;
