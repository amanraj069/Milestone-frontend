import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, loginUser, logoutUser, selectUser, selectIsLoggedIn, selectAuthLoading } from '../store/slices/authSlice';

const AuthContext = createContext();

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function AuthProvider({ children }) {
  const dispatch = useDispatch();
  
  // Use Redux state as source of truth
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  useEffect(() => {
    // Check auth status on mount
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  const sendOtp = async (email, name, password, role) => {
    const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, name, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send OTP' };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const verifyOtp = async (email, otp) => {
    const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to verify OTP' };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const login = async (credentials) => {
    try {
      const resultAction = await dispatch(loginUser(credentials));
      
      if (loginUser.fulfilled.match(resultAction)) {
        return { success: true };
      } else {
        return { success: false, error: resultAction.payload || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (userData) => {
    const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        let errorMessage = 'Signup failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();

      if (data.success) {
        // Fetch user info after signup
        await dispatch(fetchCurrentUser());
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup network error:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return { success: false, error: 'Cannot connect to server. Please make sure the backend server is running on port 9000.' };
      }
      return { success: false, error: `Network error: ${error.message}` };
    }
  };

  const logout = async () => {
    try {
      await dispatch(logoutUser());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const checkAuthStatus = async () => {
    await dispatch(fetchCurrentUser());
  };

  const getDashboardRoute = () => {
    if (!user) return null;
    switch (user.role) {
      case 'Admin':
        return '/admin/home';
      case 'Employer':
        return '/employer/home';
      case 'Freelancer':
        return '/freelancer/home';
      default:
        return '/';
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    sendOtp,
    verifyOtp,
    getDashboardRoute,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider, useAuth };