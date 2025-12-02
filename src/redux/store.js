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
import complaintsReducer from "./slices/complaintsSlice";
import authReducer from "../store/slices/authSlice";
import badgesReducer from "../store/slices/badgesSlice";
import jobsReducer from "../store/slices/jobsSlice";
import feedbackReducer from "../store/slices/feedbackSlice";

// Persist configuration - only persist auth state
const persistConfig = {
  key: "milestone-root",
  version: 1,
  storage,
  whitelist: ["auth"], // Only persist auth slice
};

const rootReducer = combineReducers({
  auth: authReducer,
  badges: badgesReducer,
  jobs: jobsReducer,
  feedback: feedbackReducer,
  complaints: complaintsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist and other actions
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
