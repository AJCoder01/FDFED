import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  uploadFile,
  uploadImage,
  uploadEvidence,
  downloadFile,
} from "../../data/apiClient.js";

export const uploadFileThunk = createAsyncThunk(
  "files/uploadFile",
  async ({ file, purpose = "evidence" }, { rejectWithValue }) => {
    try {
      return await uploadFile(file, purpose);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to upload file");
    }
  }
);

export const uploadImageThunk = createAsyncThunk(
  "files/uploadImage",
  async (value, { rejectWithValue }) => {
    try {
      return await uploadImage(value);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to upload image");
    }
  }
);

export const uploadEvidenceThunk = createAsyncThunk(
  "files/uploadEvidence",
  async (files, { rejectWithValue }) => {
    try {
      return await uploadEvidence(files);
    } catch (err) {
      return rejectWithValue(err.message || "Failed to upload evidence");
    }
  }
);

export const downloadFileThunk = createAsyncThunk(
  "files/downloadFile",
  async ({ id, filename, preview = false }, { rejectWithValue }) => {
    try {
      await downloadFile(id, filename, preview);
      return { id, filename };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to download file");
    }
  }
);

const initialState = {
  uploading: false,
  uploadedFiles: [],
  error: null,
};

const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    clearFilesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFileThunk.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadFileThunk.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadedFiles.push(action.payload);
      })
      .addCase(uploadFileThunk.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(uploadEvidenceThunk.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadEvidenceThunk.fulfilled, (state) => {
        state.uploading = false;
      })
      .addCase(uploadEvidenceThunk.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(uploadImageThunk.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadImageThunk.fulfilled, (state) => {
        state.uploading = false;
      })
      .addCase(uploadImageThunk.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(downloadFileThunk.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearFilesError } = filesSlice.actions;

export const selectFilesUploading = (state) => state.files.uploading;
export const selectFilesError = (state) => state.files.error;

export default filesSlice.reducer;
