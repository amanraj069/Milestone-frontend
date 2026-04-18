import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { graphqlQuery } from '../../utils/graphqlClient';
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const API_BASE_URL = getBackendBaseUrl();

// Thunk to submit feedback
export const submitFeedback = createAsyncThunk(
  'feedback/submitFeedback',
  async (feedbackData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error || 'Failed to submit feedback');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to load feedbacks for a job — now uses GraphQL with DataLoader batching
export const loadFeedbacksForJob = createAsyncThunk(
  'feedback/loadFeedbacksForJob',
  async (jobId, { rejectWithValue }) => {
    try {
      const data = await graphqlQuery(`
        query FeedbacksForJob($jobId: String!) {
          feedbacksForJob(jobId: $jobId) {
            _id
            jobId
            fromUserId
            toUserId
            toRole
            rating
            comment
            tags
            anonymous
            createdAt
            fromUser {
              name
              picture
            }
          }
        }
      `, { jobId });

      return { jobId, feedbacks: data.feedbacksForJob };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to load feedbacks for a user — now uses GraphQL with DataLoader batching
export const loadFeedbacksForUser = createAsyncThunk(
  'feedback/loadFeedbacksForUser',
  async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const data = await graphqlQuery(`
        query FeedbacksForUser($userId: String!, $page: Int, $limit: Int) {
          feedbacksForUser(userId: $userId, page: $page, limit: $limit) {
            feedbacks {
              _id
              jobId
              fromUserId
              toUserId
              toRole
              rating
              comment
              tags
              anonymous
              createdAt
              fromUser {
                name
                picture
              }
            }
            total
            page
            limit
          }
        }
      `, { userId, page, limit });

      const result = data.feedbacksForUser;
      return { userId, feedbacks: result.feedbacks, total: result.total, page: result.page };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to load feedback stats for a user (stats use aggregation, no N+1 — but kept for consistency)
export const loadUserFeedbackStats = createAsyncThunk(
  'feedback/loadUserFeedbackStats',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/stats/${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error || 'Failed to load feedback stats');
      }

      return { userId, stats: result.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to check if user can give feedback for a job (stays REST no N+1 issue)
export const checkCanGiveFeedback = createAsyncThunk(
  'feedback/checkCanGiveFeedback',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/can-give/${jobId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error || 'Failed to check feedback eligibility');
      }

      return { jobId, ...result.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState: {
    byJob: {}, // { [jobId]: [feedback objects] }
    byUser: {}, // { [userId]: { feedbacks: [], total: 0, page: 1 } }
    statsByUser: {}, // { [userId]: { totalFeedbacks, averageRating, ratingDistribution } }
    eligibilityByJob: {}, // { [jobId]: { canGiveFeedback, reason, counterparty } }
    loading: false,
    error: null,
    lastSubmitted: null,
  },
  reducers: {
    clearFeedbackError: (state) => {
      state.error = null;
    },
    clearLastSubmitted: (state) => {
      state.lastSubmitted = null;
    },
  },
  extraReducers: (builder) => {
    // submitFeedback
    builder
      .addCase(submitFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.loading = false;
        state.lastSubmitted = action.payload;
        
        // Add to byJob if it exists
        const jobId = action.payload.jobId;
        if (state.byJob[jobId]) {
          state.byJob[jobId].unshift(action.payload);
        }
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // loadFeedbacksForJob
    builder
      .addCase(loadFeedbacksForJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadFeedbacksForJob.fulfilled, (state, action) => {
        state.loading = false;
        const { jobId, feedbacks } = action.payload;
        state.byJob[jobId] = feedbacks;
      })
      .addCase(loadFeedbacksForJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // loadFeedbacksForUser
    builder
      .addCase(loadFeedbacksForUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadFeedbacksForUser.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, feedbacks, total, page } = action.payload;
        state.byUser[userId] = { feedbacks, total, page };
      })
      .addCase(loadFeedbacksForUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // loadUserFeedbackStats
    builder
      .addCase(loadUserFeedbackStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserFeedbackStats.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, stats } = action.payload;
        state.statsByUser[userId] = stats;
      })
      .addCase(loadUserFeedbackStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // checkCanGiveFeedback
    builder
      .addCase(checkCanGiveFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkCanGiveFeedback.fulfilled, (state, action) => {
        state.loading = false;
        const { jobId, ...eligibility } = action.payload;
        state.eligibilityByJob[jobId] = eligibility;
      })
      .addCase(checkCanGiveFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFeedbackError, clearLastSubmitted } = feedbackSlice.actions;

// Selectors
export const selectFeedbacksForJob = (state, jobId) => state.feedback.byJob[jobId] || [];
export const selectFeedbacksForUser = (state, userId) => state.feedback.byUser[userId] || { feedbacks: [], total: 0, page: 1 };
export const selectUserFeedbackStats = (state, userId) => state.feedback.statsByUser[userId] || { totalFeedbacks: 0, averageRating: 0, ratingDistribution: {} };
export const selectFeedbackEligibility = (state, jobId) => state.feedback.eligibilityByJob[jobId] || null;
export const selectFeedbackLoading = (state) => state.feedback.loading;
export const selectFeedbackError = (state) => state.feedback.error;
export const selectLastSubmittedFeedback = (state) => state.feedback.lastSubmitted;

export default feedbackSlice.reducer;
