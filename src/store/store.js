import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import badgesReducer from './slices/badgesSlice';
import blogReducer from './slices/blogSlice';
import complaintsReducer from './slices/complaintsSlice';
import feedbackReducer from './slices/feedbackSlice';
import jobsReducer from './slices/jobsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    badges: badgesReducer,
    blog: blogReducer,
    complaints: complaintsReducer,
    feedback: feedbackReducer,
    jobs: jobsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['complaints/fetchComplaints/fulfilled', 'persist/PERSIST'],
      },
    }),
});

export default store;
