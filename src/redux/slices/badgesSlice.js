import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { graphqlQuery } from '../../utils/graphqlClient';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

// Thunk to load all badges (stays REST — it's a simple list, no N+1)
export const loadBadges = createAsyncThunk(
  'badges/loadBadges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/badges/list`, {
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

// Thunk to load user badges — now uses GraphQL with DataLoader batching
export const loadUserBadges = createAsyncThunk(
  'badges/loadUserBadges',
  async (userId, { rejectWithValue }) => {
    try {
      const data = await graphqlQuery(`
        query UserBadges($userId: String!) {
          userBadges(userId: $userId) {
            badge {
              _id
              title
              skillName
              description
              icon
              criteria {
                type
                quizId
                minPercentage
              }
              createdAt
            }
            awardedAt
          }
        }
      `, { userId });

      return { userId, badges: data.userBadges };
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
