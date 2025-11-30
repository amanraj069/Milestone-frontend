import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import quizzesReducer from './slices/quizzesSlice';
import attemptsReducer from './slices/attemptsSlice';
import badgesReducer from './slices/badgesSlice';
import jobsReducer from './slices/jobsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quizzes: quizzesReducer,
    attempts: attemptsReducer,
    badges: badgesReducer,
    jobs: jobsReducer,
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
