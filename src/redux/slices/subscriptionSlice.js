import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  plan: 'Basic',
  duration: null, // '3months', '9months', '1year'
  expiryDate: null,
  isLoading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionPlan: (state, action) => {
      state.plan = action.payload.plan;
      state.duration = action.payload.duration;
      state.expiryDate = action.payload.expiryDate;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetSubscription: (state) => {
      state.plan = 'Basic';
      state.duration = null;
      state.expiryDate = null;
      state.error = null;
    },
  },
});

export const {
  setSubscriptionPlan,
  setLoading,
  setError,
  clearError,
  resetSubscription,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
