import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { marketplaceRepository } from '../../repositories/marketplaceRepository.js';

export const fetchCategories = createAsyncThunk('marketplace/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    return await marketplaceRepository.fetchCategories();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load categories.');
  }
});

export const createCategory = createAsyncThunk('marketplace/createCategory', async (data, { rejectWithValue }) => {
  try {
    return await marketplaceRepository.createCategory(data);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to create category.');
  }
});

export const updateCategory = createAsyncThunk('marketplace/updateCategory', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await marketplaceRepository.updateCategory(id, data);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to update category.');
  }
});

export const deleteCategory = createAsyncThunk('marketplace/deleteCategory', async (id, { rejectWithValue }) => {
  try {
    await marketplaceRepository.deleteCategory(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to delete category.');
  }
});

export const fetchServices = createAsyncThunk('marketplace/fetchServices', async (filters = {}, { rejectWithValue }) => {
  try {
    return await marketplaceRepository.fetchServices(filters);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load services.');
  }
});

export const fetchServiceById = createAsyncThunk(
  'marketplace/fetchServiceById',
  async ({ serviceId, actor }, { rejectWithValue }) => {
    try {
      return await marketplaceRepository.fetchServiceById(serviceId, actor);
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to load service.');
    }
  },
);

export const createService = createAsyncThunk('marketplace/createService', async (values, { rejectWithValue }) => {
  try {
    return await marketplaceRepository.createService(values);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to create service.');
  }
});

export const updateService = createAsyncThunk('marketplace/updateService', async ({ id, values }, { rejectWithValue }) => {
  try {
    return await marketplaceRepository.updateService(id, values);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to update service.');
  }
});

export const deleteService = createAsyncThunk('marketplace/deleteService', async (serviceId, { rejectWithValue }) => {
  try {
    await marketplaceRepository.deleteService(serviceId);
    return serviceId;
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to delete service.');
  }
});

export const fetchServiceReviews = createAsyncThunk(
  'marketplace/fetchServiceReviews',
  async (serviceId, { rejectWithValue }) => {
    try {
      const reviews = await marketplaceRepository.fetchServiceReviews(serviceId);
      return { serviceId, reviews };
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to load reviews.');
    }
  },
);

export const submitReview = createAsyncThunk('marketplace/submitReview', async (payload, { rejectWithValue }) => {
  try {
    return await marketplaceRepository.submitReview(payload);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to submit review.');
  }
});

export const replyToReview = createAsyncThunk('marketplace/replyToReview', async (payload, { rejectWithValue }) => {
  try {
    return await marketplaceRepository.replyToReview(payload);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to reply to review.');
  }
});

export const fetchJobRequests = createAsyncThunk('marketplace/fetchJobRequests', async (_, { rejectWithValue }) => {
  try {
    return await marketplaceRepository.fetchJobRequests();
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load job requests.');
  }
});

export const createJobRequest = createAsyncThunk('marketplace/createJobRequest', async (values, { rejectWithValue }) => {
  try {
    return await marketplaceRepository.createJobRequest(values);
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to submit job request.');
  }
});

export const deleteJobRequest = createAsyncThunk('marketplace/deleteJobRequest', async (id, { rejectWithValue }) => {
  try {
    await marketplaceRepository.deleteJobRequest(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to delete job request.');
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

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState: {
    categories: [],
    services: [],
    selectedService: null,
    reviewsByServiceId: {},
    jobRequests: [],
    loading: false,
    error: null,
    mutationStatus: 'idle',
    mutationError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createCategory.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.categories = [...state.categories, action.payload];
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(updateCategory.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.categories = upsertById(state.categories, action.payload);
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(deleteCategory.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.categories = state.categories.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload || [];
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchServiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedService = action.payload;
        state.services = upsertById(state.services, action.payload);
      })
      .addCase(fetchServiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createService.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.services = upsertById(state.services, action.payload);
      })
      .addCase(createService.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(updateService.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.services = upsertById(state.services, action.payload);
        if (state.selectedService?.id === action.payload?.id) state.selectedService = action.payload;
      })
      .addCase(updateService.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(deleteService.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.services = state.services.filter((s) => s.id !== action.payload);
        if (state.selectedService?.id === action.payload) state.selectedService = null;
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(fetchServiceReviews.fulfilled, (state, action) => {
        state.reviewsByServiceId[action.payload.serviceId] = action.payload.reviews || [];
      })

      .addCase(submitReview.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(submitReview.fulfilled, (state) => {
        state.mutationStatus = 'succeeded';
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(replyToReview.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(replyToReview.fulfilled, (state) => {
        state.mutationStatus = 'succeeded';
      })
      .addCase(replyToReview.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(fetchJobRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchJobRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.jobRequests = action.payload || [];
      })
      .addCase(fetchJobRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createJobRequest.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createJobRequest.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.jobRequests = [action.payload, ...state.jobRequests];
      })
      .addCase(createJobRequest.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      })

      .addCase(deleteJobRequest.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.jobRequests = state.jobRequests.filter((r) => r.id !== action.payload);
      });
  },
});

const selectMarketplaceSlice = (state) => state.marketplace;
export const selectCategories = createSelector(selectMarketplaceSlice, (s) => s.categories);
export const selectServices = createSelector(selectMarketplaceSlice, (s) => s.services);
export const selectSelectedService = createSelector(selectMarketplaceSlice, (s) => s.selectedService);
export const selectServiceReviewsMap = createSelector(selectMarketplaceSlice, (s) => s.reviewsByServiceId);
export const selectJobRequests = createSelector(selectMarketplaceSlice, (s) => s.jobRequests);
export const selectMarketplaceLoading = createSelector(selectMarketplaceSlice, (s) => s.loading);
export const selectMarketplaceError = createSelector(selectMarketplaceSlice, (s) => s.error);

export default marketplaceSlice.reducer;
