import { configureStore } from '@reduxjs/toolkit';
import complaintsReducer from './slices/complaintsSlice';
import authReducer from '../store/slices/authSlice';
import badgesReducer from '../store/slices/badgesSlice';
import jobsReducer from '../store/slices/jobsSlice';
import feedbackReducer from '../store/slices/feedbackSlice';
import subscriptionReducer from '../store/slices/subscriptionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    badges: badgesReducer,
    jobs: jobsReducer,
    feedback: feedbackReducer,
    complaints: complaintsReducer,
    subscription: subscriptionReducer,
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
