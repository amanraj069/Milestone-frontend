import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        credentials: 'include',
      });
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      // Test backend connectivity
      try {
        const healthCheck = await fetch(`${apiBaseUrl}/api/health`);
        if (healthCheck.ok) {
          console.log('Backend is reachable');
        }
      } catch (e) {
        console.error('Backend health check failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await checkAuthStatus();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (userData) => {
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
        // Try to parse error response
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
        // Automatically log in the user after successful signup
        await checkAuthStatus();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup network error:', error);
      // Check if it's a network error (server not reachable)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return { success: false, error: 'Cannot connect to server. Please make sure the backend server is running on port 9000.' };
      }
      return { success: false, error: `Network error: ${error.message}` };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
    getDashboardRoute,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider, useAuth };