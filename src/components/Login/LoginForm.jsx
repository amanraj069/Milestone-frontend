import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginForm = ({ formData, error, loading, handleChange, handleSubmit }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
  <div className="auth-form-content">
    {error && (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i>
        {error}
      </div>
    )}
    <form onSubmit={handleSubmit} className="milestone-form">
      <div className="form-field">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />
      </div>
      <div className="form-field">
        <label>Password</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            style={{ paddingRight: '40px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
              padding: '5px'
            }}
          >
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
      </div>
      <div className="form-field">
        <label>Login as</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="">Select role</option>
          <option value="Freelancer">Freelancer</option>
          <option value="Employer">Employer</option>
          <option value="Moderator">Moderator</option>
        </select>
      </div>
      <div className="forgot-password-link">
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>
      <button type="submit" className="milestone-btn milestone-btn-primary" disabled={loading}>
        {loading ? 'Logging In...' : 'Log In'}
      </button>
    </form>
    <div className="auth-switch">
      <span>Don't have an account? </span>
      <Link to="/signup">Sign up</Link>
    </div>
  </div>
  );
};

export default LoginForm;
