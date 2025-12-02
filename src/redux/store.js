import { configureStore } from '@reduxjs/toolkit';
import complaintsReducer from './slices/complaintsSlice';
import authReducer from './slices/authSlice';
import badgesReducer from './slices/badgesSlice';
import jobsReducer from './slices/jobsSlice';
import feedbackReducer from './slices/feedbackSlice';
import blogReducer from './slices/blogSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    badges: badgesReducer,
    blog: blogReducer,
    jobs: jobsReducer,
    feedback: feedbackReducer,
    complaints: complaintsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['complaints/fetchComplaints/fulfilled', 'persist/PERSIST'],
      },
    }),
});

export default store;
