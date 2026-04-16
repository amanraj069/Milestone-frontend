import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { graphqlQuery } from '../../utils/graphqlClient';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

// Thunk to load job history for a freelancer — now uses GraphQL with DataLoader batching
export const loadJobHistory = createAsyncThunk(
  'jobs/loadJobHistory',
  async (
    {
      search = '',
      sortBy = 'newest',
      statusIn = [],
      employerIn = [],
      jobTitleIn = [],
      page = 1,
      limit = 25,
    } = {},
    { rejectWithValue },
  ) => {
    try {
      console.log('Fetching job history via GraphQL');
      
      const data = await graphqlQuery(`
        query FreelancerJobHistory($search: String, $sortBy: String, $statusIn: [String], $employerIn: [String], $jobTitleIn: [String], $page: Int, $limit: Int) {
          freelancerJobHistory(search: $search, sortBy: $sortBy, statusIn: $statusIn, employerIn: $employerIn, jobTitleIn: $jobTitleIn, page: $page, limit: $limit) {
            total
            filterOptions { statuses employers jobTitles }
            pagination { page limit total totalPages hasNextPage hasPrevPage }
            jobs {
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
        }
      `, {
        search: search || null,
        sortBy,
        statusIn: statusIn.length ? statusIn : null,
        employerIn: employerIn.length ? employerIn : null,
        jobTitleIn: jobTitleIn.length ? jobTitleIn : null,
        page,
        limit,
      });

      const payload = data.freelancerJobHistory || {};
      console.log('Job history GraphQL result:', payload.jobs?.length || 0, 'jobs');
      return {
        jobs: payload.jobs || [],
        total: payload.total || 0,
        filterOptions: payload.filterOptions || { statuses: [], employers: [], jobTitles: [] },
        pagination: payload.pagination || null,
      };
    } catch (error) {
      console.error('Job history GraphQL error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to load active jobs for a freelancer — now uses GraphQL with DataLoader batching
export const loadActiveJobs = createAsyncThunk(
  'jobs/loadActiveJobs',
  async ({ search = '', sortBy = 'newest', page = 1, limit = 25 } = {}, { rejectWithValue }) => {
    try {
      console.log('Fetching active jobs via GraphQL');
      
      const data = await graphqlQuery(`
        query FreelancerActiveJobs($search: String, $sortBy: String, $page: Int, $limit: Int) {
          freelancerActiveJobs(search: $search, sortBy: $sortBy, page: $page, limit: $limit) {
            total
            pagination { page limit total totalPages hasNextPage hasPrevPage }
            jobs {
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
        }
      `, {
        search: search || null,
        sortBy,
        page,
        limit,
      });

      const payload = data.freelancerActiveJobs || {};
      console.log('Active jobs GraphQL result:', payload.jobs?.length || 0, 'jobs');
      return {
        jobs: payload.jobs || [],
        total: payload.total || 0,
        pagination: payload.pagination || null,
      };
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
    jobHistoryMeta: {
      total: 0,
      filterOptions: { statuses: [], employers: [], jobTitles: [] },
      pagination: null,
    },
    activeJobsMeta: {
      total: 0,
      pagination: null,
    },
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
        state.jobHistory = action.payload.jobs;
        state.jobHistoryMeta = {
          total: action.payload.total,
          filterOptions: action.payload.filterOptions,
          pagination: action.payload.pagination,
        };
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
        state.activeJobs = action.payload.jobs;
        state.activeJobsMeta = {
          total: action.payload.total,
          pagination: action.payload.pagination,
        };
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
export const selectJobHistoryMeta = (state) => state.jobs.jobHistoryMeta;
export const selectActiveJobsMeta = (state) => state.jobs.activeJobsMeta;
export const selectJobsLoading = (state) => state.jobs.loading;
export const selectJobsError = (state) => state.jobs.error;

export default jobsSlice.reducer;
