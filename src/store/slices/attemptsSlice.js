import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Thunk to submit a quiz attempt
export const submitAttempt = createAsyncThunk(
  'attempts/submitAttempt',
  async ({ quizId, answers }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:9000/api/quizzes/${quizId}/attempt`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error?.message || 'Failed to submit attempt');
      }

      return { quizId, attempt: result.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to load user attempts for a specific user
export const loadUserAttempts = createAsyncThunk(
  'attempts/loadUserAttempts',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:9000/api/quizzes/users/${userId}/attempts`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error?.message || 'Failed to load user attempts');
      }

      return { userId, attempts: result.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to count attempts for a quiz by user (calculates from loaded attempts)
export const countUserAttemptsForQuiz = createAsyncThunk(
  'attempts/countUserAttemptsForQuiz',
  async ({ quizId, userId }, { getState, dispatch, rejectWithValue }) => {
    try {
      // First ensure we have the user's attempts loaded
      const state = getState();
      const userAttempts = state.attempts.byUser[userId];
      
      if (!userAttempts || !userAttempts.list) {
        // Load attempts first
        await dispatch(loadUserAttempts(userId));
      }
      
      // Get the updated state after loading
      const updatedState = getState();
      const attempts = updatedState.attempts.byUser[userId]?.list || [];
      
      // Count attempts for this quiz
      const count = attempts.filter(a => String(a.quizId) === String(quizId)).length;
      
      return { quizId, userId, count };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const attemptsSlice = createSlice({
  name: 'attempts',
  initialState: {
    byUser: {}, // { [userId]: { list: [], loading: false } }
    attemptCounts: {}, // { [quizId_userId]: count }
    lastSubmission: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearAttemptError: (state) => {
      state.error = null;
    },
    clearLastSubmission: (state) => {
      state.lastSubmission = null;
    },
  },
  extraReducers: (builder) => {
    // submitAttempt
    builder
      .addCase(submitAttempt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.lastSubmission = action.payload.attempt;
      })
      .addCase(submitAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // loadUserAttempts
    builder
      .addCase(loadUserAttempts.pending, (state, action) => {
        const userId = action.meta.arg;
        if (!state.byUser[userId]) {
          state.byUser[userId] = { list: [], loading: true };
        } else {
          state.byUser[userId].loading = true;
        }
      })
      .addCase(loadUserAttempts.fulfilled, (state, action) => {
        const { userId, attempts } = action.payload;
        state.byUser[userId] = {
          list: attempts,
          loading: false,
        };
      })
      .addCase(loadUserAttempts.rejected, (state, action) => {
        const userId = action.meta.arg;
        if (state.byUser[userId]) {
          state.byUser[userId].loading = false;
        }
        state.error = action.payload;
      });

    // countUserAttemptsForQuiz
    builder
      .addCase(countUserAttemptsForQuiz.pending, (state) => {
        state.loading = true;
      })
      .addCase(countUserAttemptsForQuiz.fulfilled, (state, action) => {
        state.loading = false;
        const { quizId, userId, count } = action.payload;
        const key = `${quizId}_${userId}`;
        state.attemptCounts[key] = count;
      })
      .addCase(countUserAttemptsForQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAttemptError, clearLastSubmission } = attemptsSlice.actions;

// Selectors
export const selectUserAttempts = (state, userId) => 
  state.attempts.byUser[userId]?.list || [];
export const selectUserAttemptsLoading = (state, userId) => 
  state.attempts.byUser[userId]?.loading || false;
export const selectAttemptCount = (state, quizId, userId) => 
  state.attempts.attemptCounts[`${quizId}_${userId}`] || 0;
export const selectLastSubmission = (state) => state.attempts.lastSubmission;
export const selectAttemptsLoading = (state) => state.attempts.loading;
export const selectAttemptsError = (state) => state.attempts.error;

export default attemptsSlice.reducer;
