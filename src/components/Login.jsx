import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Real-time validation for email field
    if (name === 'email') {
      if (value.trim() === '') {
        setFieldErrors(prev => ({ ...prev, email: 'Email is required' }));
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      } else {
        setFieldErrors(prev => ({ ...prev, email: '' }));
      }
    }
    // Real-time validation for password field
    else if (name === 'password') {
      if (value === '') {
        setFieldErrors(prev => ({ ...prev, password: 'Password is required' }));
      } else {
        setFieldErrors(prev => ({ ...prev, password: '' }));
      }
    }
    // Real-time validation for role field
    else if (name === 'role') {
      if (value === '') {
        setFieldErrors(prev => ({ ...prev, role: 'Please select your role' }));
      } else {
        setFieldErrors(prev => ({ ...prev, role: '' }));
      }
    }
    
    // Clear general error when user types
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Reset field errors
    setFieldErrors({
      email: '',
      password: '',
      role: ''
    });

    let hasErrors = false;

    // Validate all required fields and set field-specific errors
    if (!formData.email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: 'Email is required' }));
      hasErrors = true;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      hasErrors = true;
    }
    
    if (!formData.password) {
      setFieldErrors(prev => ({ ...prev, password: 'Password is required' }));
      hasErrors = true;
    }
    
    if (!formData.role) {
      setFieldErrors(prev => ({ ...prev, role: 'Please select your role' }));
      hasErrors = true;
    }

    if (hasErrors) {
      setLoading(false);
      return;
    }

    const result = await login(formData);
    
    if (result.success) {
      // Determine dashboard route based on the selected role
      let dashboardRoute = '/';
      switch (formData.role) {
        case 'Admin':
          dashboardRoute = '/admin/profile';
          break;
        case 'Employer':
          dashboardRoute = '/employer/profile';
          break;
        case 'Freelancer':
          dashboardRoute = '/freelancer/profile';
          break;
        default:
          dashboardRoute = '/';
      }
      navigate(dashboardRoute);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-navy-100 p-5">
      <div className="flex max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl min-h-[600px] border border-gray-100">
        {/* Left Side - Form */}
        <div className="flex-1 p-12 flex items-center justify-center bg-white">
          <div className="w-full max-w-sm">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 flex items-center gap-2 text-sm font-medium">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className={`px-4 py-3 border-2 rounded-lg text-base bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400 ${
                    fieldErrors.email 
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                      : formData.email && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email) 
                        ? 'border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50' 
                        : 'border-gray-300 focus:border-navy-500 focus:ring-4 focus:ring-navy-50'
                  }`}
                />
                {fieldErrors.email && (
                  <div className="text-rose-600 text-sm mt-1">
                    {fieldErrors.email}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="off"
                    className={`px-4 py-3 pr-12 border-2 rounded-lg text-base bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400 w-full ${
                      fieldErrors.password 
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                        : formData.password
                          ? 'border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50' 
                          : 'border-gray-300 focus:border-navy-500 focus:ring-4 focus:ring-navy-50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none cursor-pointer p-1"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {fieldErrors.password && (
                  <div className="text-rose-600 text-sm mt-1">
                    {fieldErrors.password}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Login as</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`px-4 py-3 border-2 rounded-lg text-base bg-gray-50 transition-all outline-none text-gray-900 focus:bg-white focus:ring-4 ${
                    fieldErrors.role 
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-50' 
                      : formData.role
                        ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-50'
                        : 'border-gray-300 focus:border-navy-700 focus:ring-navy-100'
                  }`}
                >
                  <option value="">Select role</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Employer">Employer</option>
                  <option value="Admin">Admin</option>
                </select>
                {fieldErrors.role && (
                  <div className="text-rose-600 text-sm mt-1">
                    {fieldErrors.role}
                  </div>
                )}
              </div>

              <div className="text-right -mt-1 mb-1">
                <Link to="/forgot-password" className="text-blue-500 no-underline text-sm font-medium hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-3.5 rounded-lg font-semibold cursor-pointer transition-all text-base inline-flex items-center justify-center gap-2 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white w-full hover:from-navy-900 hover:via-navy-800 hover:to-navy-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </form>

            <div className="text-center mt-8 text-base text-gray-600">
              <span>Don't have an account? </span>
              <Link to="/signup" className="text-blue-500 no-underline font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Branding */}
        <div className="flex-1 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white px-12 py-16 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            background: 'radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)'
          }}></div>
          
          <div className="relative z-10 text-center w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight">Milestone</h1>
            </div>
            <div className="mb-12">
              <h2 className="text-2xl font-semibold leading-snug opacity-95">Unlock endless opportunities. Work on your terms.</h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <p className="text-base leading-relaxed mb-6 opacity-90 italic text-left">"Working with Milestone was an amazing experience! Their attention to detail, professionalism, and timely delivery exceeded my expectations. Highly recommended!"</p>
              <div className="flex items-center gap-4">
                <img src="/assets/user_image.jpg" alt="Aman Raj" className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
                <div className="text-left">
                  <strong className="block text-base font-semibold mb-0.5">Aman Raj</strong>
                  <span className="text-sm opacity-80">CEO at Zapeds, Chennai, India</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;