import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Thunk to load all badges
export const loadBadges = createAsyncThunk(
  'badges/loadBadges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:9000/api/quizzes/badges/list', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error?.message || 'Failed to load badges');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk to load user badges
export const loadUserBadges = createAsyncThunk(
  'badges/loadUserBadges',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:9000/api/quizzes/users/${userId}/badges`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return rejectWithValue(result.error?.message || 'Failed to load user badges');
      }

      return { userId, badges: result.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const badgesSlice = createSlice({
  name: 'badges',
  initialState: {
    badgesById: {}, // All available badges { [badgeId]: badge }
    userBadgesByUserId: {}, // User's earned badges { [userId]: [badge objects] }
    loading: false,
    error: null,
  },
  reducers: {
    clearBadgeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // loadBadges
    builder
      .addCase(loadBadges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadBadges.fulfilled, (state, action) => {
        state.loading = false;
        const badges = action.payload;
        badges.forEach((badge) => {
          state.badgesById[badge._id] = badge;
        });
      })
      .addCase(loadBadges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // loadUserBadges
    builder
      .addCase(loadUserBadges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserBadges.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, badges } = action.payload;
        state.userBadgesByUserId[userId] = badges;
      })
      .addCase(loadUserBadges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBadgeError } = badgesSlice.actions;

// Selectors
export const selectAllBadges = (state) => Object.values(state.badges.badgesById);
export const selectBadgeById = (state, badgeId) => state.badges.badgesById[badgeId];
export const selectUserBadges = (state, userId) => 
  state.badges.userBadgesByUserId[userId] || [];
export const selectBadgesLoading = (state) => state.badges.loading;
export const selectBadgesError = (state) => state.badges.error;

export default badgesSlice.reducer;
