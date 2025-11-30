import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Thunk to load job history for a freelancer
export const loadJobHistory = createAsyncThunk(
  'jobs/loadJobHistory',
  async (_, { rejectWithValue }) => {
    try {
      // Try multiple endpoints as fallback
      const endpoints = [
        'http://localhost:9000/api/freelancer/job_history/api',
        'http://localhost:9000/api/freelancer/job-history',
        'http://localhost:9000/api/freelancer/jobs/history',
      ];

      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          // Skip HTML responses
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            continue;
          }

          const result = await response.json();

          if (response.ok && result.success) {
            return result.historyJobs || result.jobs || result.data || [];
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      return rejectWithValue(lastError?.message || 'Failed to load job history');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to load active jobs for a freelancer
export const loadActiveJobs = createAsyncThunk(
  'jobs/loadActiveJobs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:9000/api/freelancer/active_job/api', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error || 'Failed to load active jobs');
      }

      return result.activeJobs || result.jobs || result.data || [];
    } catch (error) {
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
