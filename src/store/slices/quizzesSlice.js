import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Thunk to load a specific quiz for taking
export const loadQuiz = createAsyncThunk(
  'quizzes/loadQuiz',
  async (quizId, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:9000/api/quizzes/${quizId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error?.message || 'Failed to load quiz');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to list all available quizzes
export const listQuizzes = createAsyncThunk(
  'quizzes/listQuizzes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:9000/api/quizzes', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error?.message || 'Failed to list quizzes');
      }

      // Backend returns { data: { quizzes, total, page, limit } }
      return result.data.quizzes || result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const quizzesSlice = createSlice({
  name: 'quizzes',
  initialState: {
    byId: {},
    allIds: [],
    currentQuizId: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearQuizError: (state) => {
      state.error = null;
    },
    setCurrentQuiz: (state, action) => {
      state.currentQuizId = action.payload;
    },
    clearCurrentQuiz: (state) => {
      state.currentQuizId = null;
    },
  },
  extraReducers: (builder) => {
    // loadQuiz
    builder
      .addCase(loadQuiz.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadQuiz.fulfilled, (state, action) => {
        state.loading = false;
        const quiz = action.payload;
        state.byId[quiz._id] = quiz;
        state.currentQuizId = quiz._id;
        if (!state.allIds.includes(quiz._id)) {
          state.allIds.push(quiz._id);
        }
      })
      .addCase(loadQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // listQuizzes
    builder
      .addCase(listQuizzes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listQuizzes.fulfilled, (state, action) => {
        state.loading = false;
        const quizzes = action.payload;
        state.allIds = quizzes.map((q) => q._id);
        quizzes.forEach((quiz) => {
          state.byId[quiz._id] = quiz;
        });
      })
      .addCase(listQuizzes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearQuizError, setCurrentQuiz, clearCurrentQuiz } = quizzesSlice.actions;

// Selectors
export const selectQuizById = (state, quizId) => state.quizzes.byId[quizId];
export const selectCurrentQuiz = (state) => 
  state.quizzes.currentQuizId ? state.quizzes.byId[state.quizzes.currentQuizId] : null;
export const selectAllQuizzes = (state) => 
  state.quizzes.allIds.map((id) => state.quizzes.byId[id]);
export const selectQuizzesLoading = (state) => state.quizzes.loading;
export const selectQuizzesError = (state) => state.quizzes.error;

export default quizzesSlice.reducer;
