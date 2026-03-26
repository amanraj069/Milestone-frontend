import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { graphqlQuery } from '../../utils/graphqlClient';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

// Thunk to load job history for a freelancer — now uses GraphQL with DataLoader batching
export const loadJobHistory = createAsyncThunk(
  'jobs/loadJobHistory',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching job history via GraphQL');
      
      const data = await graphqlQuery(`
        query FreelancerJobHistory {
          freelancerJobHistory {
            id
            _id
            title
            company
            logo
            status
            tech
            employerUserId
            date
            price
            paidAmount
            totalBudget
            rating
            startDate
            startDateRaw
            endDateRaw
            daysSinceStart
            description
            milestones {
              milestoneId
              description
              deadline
              payment
              status
              requested
              completionPercentage
              subTasks {
                subTaskId
                description
                status
                completedDate
                notes
              }
            }
            milestonesCount
            completedMilestones
            progress
            cancelReason
          }
        }
      `);

      console.log('Job history GraphQL result:', data.freelancerJobHistory?.length, 'jobs');
      return data.freelancerJobHistory || [];
    } catch (error) {
      console.error('Job history GraphQL error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to load active jobs for a freelancer — now uses GraphQL with DataLoader batching
export const loadActiveJobs = createAsyncThunk(
  'jobs/loadActiveJobs',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching active jobs via GraphQL');
      
      const data = await graphqlQuery(`
        query FreelancerActiveJobs {
          freelancerActiveJobs {
            id
            title
            company
            logo
            deadline
            price
            totalBudget
            paidAmount
            progress
            tech
            employerUserId
            description
            milestones {
              milestoneId
              description
              deadline
              payment
              status
              requested
              completionPercentage
              subTasks {
                subTaskId
                description
                status
                completedDate
                notes
              }
            }
            milestonesCount
            completedMilestones
            daysSinceStart
            startDate
            startDateRaw
          }
        }
      `);

      console.log('Active jobs GraphQL result:', data.freelancerActiveJobs?.length, 'jobs');
      return data.freelancerActiveJobs || [];
    } catch (error) {
      console.error('Active jobs GraphQL error:', error);
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
