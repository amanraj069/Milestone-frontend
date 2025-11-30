import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

// Thunk to load job history for a freelancer
export const loadJobHistory = createAsyncThunk(
  'jobs/loadJobHistory',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching job history from:', `${API_BASE_URL}/api/freelancer/job_history/api`);
      
      const response = await fetch(`${API_BASE_URL}/api/freelancer/job_history/api`, {
        method: 'GET',
        credentials: 'include',
      });

      console.log('Job history response status:', response.status);
      
      const result = await response.json();
      console.log('Job history result:', result);

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error || 'Failed to load job history');
      }

      return result.historyJobs || result.jobs || result.data || [];
    } catch (error) {
      console.error('Job history error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to load active jobs for a freelancer
export const loadActiveJobs = createAsyncThunk(
  'jobs/loadActiveJobs',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching active jobs from:', `${API_BASE_URL}/api/freelancer/active_job/api`);
      
      const response = await fetch(`${API_BASE_URL}/api/freelancer/active_job/api`, {
        method: 'GET',
        credentials: 'include',
      });

      console.log('Active jobs response status:', response.status);
      
      const result = await response.json();
      console.log('Active jobs result:', result);

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error || 'Failed to load active jobs');
      }

      return result.activeJobs || result.jobs || result.data || [];
    } catch (error) {
      console.error('Active jobs error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobHistory: [],
    activeJobs: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearJobError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // loadJobHistory
    builder
      .addCase(loadJobHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadJobHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.jobHistory = action.payload;
      })
      .addCase(loadJobHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // loadActiveJobs
    builder
      .addCase(loadActiveJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadActiveJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.activeJobs = action.payload;
      })
      .addCase(loadActiveJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearJobError } = jobsSlice.actions;

// Selectors
export const selectJobHistory = (state) => state.jobs.jobHistory;
export const selectActiveJobs = (state) => state.jobs.activeJobs;
export const selectJobsLoading = (state) => state.jobs.loading;
export const selectJobsError = (state) => state.jobs.error;

export default jobsSlice.reducer;
