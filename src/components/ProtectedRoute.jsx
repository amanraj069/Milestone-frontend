import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Paths that unapproved employers can access
const UNAPPROVED_EMPLOYER_ALLOWED_PATHS = [
  '/employer/profile',
  '/employer/profile/edit',
  '/employer/company-details',
  '/',
];

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to login if user doesn't have the required role
    return <Navigate to="/login" replace />;
  }

  // Check if employer is unapproved and trying to access restricted pages
  if (user.role === 'Employer' && user.isApproved === false) {
    const isAllowedPath = UNAPPROVED_EMPLOYER_ALLOWED_PATHS.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + '/')
    );
    
    if (!isAllowedPath) {
      // Redirect unapproved employers to profile page
      return <Navigate to="/employer/profile" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;