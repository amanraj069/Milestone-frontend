import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlice";
import badgesReducer from "./slices/badgesSlice";
import blogReducer from "./slices/blogSlice";
import complaintsReducer from "./slices/complaintsSlice";
import feedbackReducer from "./slices/feedbackSlice";
import jobsReducer from "./slices/jobsSlice";
import subscriptionReducer from "./slices/subscriptionSlice";

// Persist configuration - only persist auth state
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth"], // Only persist auth slice
};

const rootReducer = combineReducers({
  auth: authReducer,
  badges: badgesReducer,
  blog: blogReducer,
  complaints: complaintsReducer,
  feedback: feedbackReducer,
  jobs: jobsReducer,
  subscription: subscriptionReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions and complaints action
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          "complaints/fetchComplaints/fulfilled",
        ],
      },
    }),
});

export const persistor = persistStore(store);

export default store;
