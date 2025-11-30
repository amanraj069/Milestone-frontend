import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import badgesReducer from './slices/badgesSlice';
import jobsReducer from './slices/jobsSlice';
import feedbackReducer from './slices/feedbackSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    badges: badgesReducer,
    jobs: jobsReducer,
    feedback: feedbackReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types if needed
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;
