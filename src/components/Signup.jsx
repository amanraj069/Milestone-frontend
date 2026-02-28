import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  // Step 1: Basic info, Step 2: Password, Step 3: OTP verification
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    otp: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);
  const { signup, sendOtp, verifyOtp, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const startResendTimer = () => {
    setResendDisabled(true);
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Block numbers in name field
    let processedValue = value;
    if (name === 'name') {
      processedValue = value.replace(/[0-9]/g, '');
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    
    // Real-time validation for name field
    if (name === 'name') {
      if (processedValue.trim() === '') {
        setFieldErrors(prev => ({ ...prev, name: 'Full name is required' }));
      } else if (processedValue.trim().length < 2) {
        setFieldErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }));
      } else {
        setFieldErrors(prev => ({ ...prev, name: '' }));
      }
    }
    // Real-time validation for email field
    else if (name === 'email') {
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
      } else if (value.length < 6) {
        setFieldErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      } else if (!/[A-Z]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, password: 'Password must contain at least one capital letter' }));
      } else if (!/[0-9]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, password: 'Password must contain at least one digit' }));
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, password: 'Password must contain at least one special character' }));
      } else {
        setFieldErrors(prev => ({ ...prev, password: '' }));
      }
      
      // Also validate confirm password if it has a value
      if (formData.confirmPassword) {
        if (formData.confirmPassword !== value) {
          setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else {
          setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
      }
    }
    // Real-time validation for confirm password field
    else if (name === 'confirmPassword') {
      if (value === '') {
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      } else if (value !== formData.password) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
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

  // Handle individual OTP digit input
  const handleOtpDigitChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(0, 1);
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = digit;
    setOtpDigits(newOtpDigits);
    
    // Update formData.otp with combined digits
    const combinedOtp = newOtpDigits.join('');
    setFormData(prev => ({ ...prev, otp: combinedOtp }));
    setError('');
    
    // Auto-focus next input if digit entered
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace for OTP inputs
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // If current input is empty, move to previous and clear it
        otpInputRefs.current[index - 1]?.focus();
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index - 1] = '';
        setOtpDigits(newOtpDigits);
        setFormData(prev => ({ ...prev, otp: newOtpDigits.join('') }));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste for OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtpDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newOtpDigits[i] = pastedData[i] || '';
      }
      setOtpDigits(newOtpDigits);
      setFormData(prev => ({ ...prev, otp: newOtpDigits.join('') }));
      
      // Focus the last filled input or the next empty one
      const focusIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    
    // Send all user data along with OTP request
    const result = await sendOtp(formData.email, formData.name, formData.password, formData.role);
    
    if (result.success) {
      setCurrentStep(3); // Move to OTP verification step
      startResendTimer();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await verifyOtp(formData.email, formData.otp);
    
    if (result.success) {
      // OTP verified, now complete signup
      const { confirmPassword, otp, ...submitData } = formData;
      const signupResult = await signup(submitData);
      
      if (signupResult.success) {
        const dashboardRoute = getDashboardRoute();
        navigate(dashboardRoute || '/');
      } else {
        setError(signupResult.error);
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendDisabled) return;
    setLoading(true);
    setError('');
    
    const result = await sendOtp(formData.email, formData.name, formData.password, formData.role);
    
    if (result.success) {
      startResendTimer();
      // Clear OTP inputs on resend
      setOtpDigits(['', '', '', '', '', '']);
      setFormData(prev => ({ ...prev, otp: '' }));
      otpInputRefs.current[0]?.focus();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    setError('');
    
    // Reset field errors
    setFieldErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: ''
    });

    let hasErrors = false;

    // Validate step 1 fields and set field-specific errors
    if (!formData.name.trim()) {
      setFieldErrors(prev => ({ ...prev, name: 'Full name is required' }));
      hasErrors = true;
    } else if (formData.name.trim().length < 2) {
      setFieldErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }));
      hasErrors = true;
    }
    
    if (!formData.email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: 'Email is required' }));
      hasErrors = true;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      hasErrors = true;
    }
    
    if (!formData.role) {
      setFieldErrors(prev => ({ ...prev, role: 'Please select your role' }));
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    // Move to password step (Step 2)
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setError('');
    if (currentStep === 2) {
      setCurrentStep(1);
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } else if (currentStep === 3) {
      setCurrentStep(2);
      setFormData(prev => ({ ...prev, otp: '' }));
      setOtpDigits(['', '', '', '', '', '']);
    }
    // Clear field errors when going back
    setFieldErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Reset field errors
    setFieldErrors(prev => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }));

    let hasErrors = false;

    // Validate password fields and set field-specific errors
    if (!formData.password) {
      setFieldErrors(prev => ({ ...prev, password: 'Password is required' }));
      hasErrors = true;
    } else if (formData.password.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      hasErrors = true;
    } else if (!/[A-Z]/.test(formData.password)) {
      setFieldErrors(prev => ({ ...prev, password: 'Password must contain at least one capital letter' }));
      hasErrors = true;
    } else if (!/[0-9]/.test(formData.password)) {
      setFieldErrors(prev => ({ ...prev, password: 'Password must contain at least one digit' }));
      hasErrors = true;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setFieldErrors(prev => ({ ...prev, password: 'Password must contain at least one special character' }));
      hasErrors = true;
    }
    
    if (!formData.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      hasErrors = true;
    } else if (formData.password !== formData.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      hasErrors = true;
    }

    if (hasErrors) {
      setLoading(false);
      return;
    }

    // Send OTP after password validation - moves to Step 3
    await handleSendOtp();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-navy-100 p-5">
      <div className="flex max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl min-h-[600px] border border-gray-100">
        {/* Left Side - Form */}
        <div className="flex-1 p-12 flex items-center justify-center bg-white">
          <div className="w-full max-w-sm">
            {/* Step Indicator */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-navy-50 to-navy-100 px-4 py-2 rounded-full text-sm font-medium text-gray-600 border border-gray-200">
                <span className="text-navy-700 font-bold">{currentStep}</span>
                <span className="text-gray-500">of 3</span>
              </div>
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Milestone</h2>
                  <p className="text-base text-gray-600">Let's start with the basics</p>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 flex items-center gap-2 text-sm font-medium">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleNextStep} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      autoFocus
                      className={`px-4 py-3 border-2 rounded-lg text-base bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400 ${
                        fieldErrors.name 
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                          : formData.name.trim().length >= 2 
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50' 
                            : 'border-gray-300 focus:border-navy-500 focus:ring-4 focus:ring-navy-50'
                      }`}
                    />
                    {fieldErrors.name && (
                      <div className="text-rose-600 text-sm mt-1">
                        {fieldErrors.name}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
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
                    <label className="text-sm font-medium text-gray-700">Register as</label>
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
                      <option value="Moderator">Moderator</option>
                    </select>
                    {fieldErrors.role && (
                      <div className="text-rose-600 text-sm mt-1">
                        {fieldErrors.role}
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading} className="px-6 py-3.5 rounded-lg font-semibold cursor-pointer transition-all text-base inline-flex items-center justify-center gap-2 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white w-full hover:from-navy-900 hover:via-navy-800 hover:to-navy-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <i className="fas fa-arrow-right"></i>
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-8 text-base text-gray-600">
                  <span>Already have an account? </span>
                  <Link to="/login" className="text-blue-500 no-underline font-semibold hover:underline">Sign in</Link>
                </div>
              </>
            )}

            {/* Step 2: Password Setup */}
            {currentStep === 2 && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Your Account</h2>
                  <p className="text-base text-gray-600">Create a strong password to protect your account</p>
                </div>

                <div className="bg-gradient-to-r from-navy-50 to-navy-100 border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-navy-950 to-navy-800 rounded-full flex items-center justify-center text-white text-lg">
                      <i className="fas fa-user"></i>
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900 mb-0.5">{formData.name}</div>
                      <div className="text-sm text-gray-600 mb-0.5">{formData.email}</div>
                      <div className="text-xs text-navy-700 font-medium bg-navy-50 py-0.5 rounded-xl inline-block">{formData.role}</div>
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 flex items-center gap-2 text-sm font-medium">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        autoComplete="off"
                        autoFocus
                        className={`px-4 py-3 pr-12 border-2 rounded-lg text-base bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400 w-full ${
                          fieldErrors.password 
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                            : formData.password && 
                              formData.password.length >= 6 && 
                              /[A-Z]/.test(formData.password) && 
                              /[0-9]/.test(formData.password) && 
                              /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
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
                    {fieldErrors.password ? (
                      <div className="text-rose-600 text-xs mt-1">
                        {fieldErrors.password}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">
                        Min 6 characters, 1 capital, 1 digit, 1 special character
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        autoComplete="off"
                        className={`px-4 py-3 pr-12 border-2 rounded-lg text-base bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400 w-full ${
                          fieldErrors.confirmPassword 
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                            : formData.confirmPassword && formData.confirmPassword === formData.password
                              ? 'border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50' 
                              : 'border-gray-300 focus:border-navy-500 focus:ring-4 focus:ring-navy-50'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors bg-transparent border-none cursor-pointer p-1"
                      >
                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <div className="text-rose-600 text-xs mt-1">
                        {fieldErrors.confirmPassword}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={handlePrevStep} className="px-6 py-3.5 rounded-lg font-semibold cursor-pointer transition-all text-base inline-flex items-center justify-center gap-2 bg-transparent border-2 border-navy-700 text-navy-700 hover:bg-navy-700 hover:text-white hover:-translate-y-0.5 flex-none min-w-[100px]">
                      <i className="fas fa-arrow-left"></i>
                      <span>Back</span>
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 px-6 py-3.5 rounded-lg font-semibold cursor-pointer transition-all text-base inline-flex items-center justify-center gap-2 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white hover:from-navy-900 hover:via-navy-800 hover:to-navy-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <i className="fas fa-arrow-right"></i>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 3: OTP Verification */}
            {currentStep === 3 && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                  <p className="text-base text-gray-600">We've sent a 6-digit OTP to <strong>{formData.email}</strong></p>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 flex items-center gap-2 text-sm font-medium">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-gray-700 text-center">Enter OTP</label>
                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          autoFocus={index === 0}
                          maxLength={1}
                          className={`w-12 h-14 border-2 rounded-lg text-xl bg-white transition-all outline-none text-gray-900 text-center font-bold ${
                            digit 
                              ? 'border-navy-500 bg-navy-50' 
                              : 'border-gray-300'
                          } focus:border-navy-600 focus:ring-4 focus:ring-navy-100`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      OTP is valid for 10 minutes
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleVerifyOtp} 
                    disabled={loading || formData.otp.length !== 6}
                    className="px-6 py-3.5 rounded-lg font-semibold cursor-pointer transition-all text-base inline-flex items-center justify-center gap-2 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white w-full hover:from-navy-900 hover:via-navy-800 hover:to-navy-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Create Account</span>
                        <i className="fas fa-check"></i>
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <span className="text-gray-600">Didn't receive the OTP? </span>
                    <button 
                      type="button" 
                      onClick={handleResendOtp} 
                      disabled={resendDisabled || loading}
                      className={`font-semibold bg-transparent border-none cursor-pointer ${resendDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:underline'}`}
                    >
                      {resendDisabled ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <button 
                    type="button" 
                    onClick={handlePrevStep} 
                    className="px-6 py-3.5 rounded-lg font-semibold cursor-pointer transition-all text-base inline-flex items-center justify-center gap-2 bg-transparent border-2 border-navy-700 text-navy-700 hover:bg-navy-700 hover:text-white hover:-translate-y-0.5"
                  >
                    <i className="fas fa-arrow-left"></i>
                    <span>Back to Password</span>
                  </button>
                </div>
              </>
            )}
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
              <h2 className="text-2xl font-semibold leading-snug opacity-95">Start your journey with us. Create opportunities.</h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <p className="text-base leading-relaxed mb-6 opacity-90 italic text-left">"Milestone helped me find the perfect freelancers for my project. The platform is intuitive and the quality of talent is exceptional!"</p>
              <div className="flex items-center gap-4">
                <img src="/assets/user_female.png" alt="Client" className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
                <div className="text-left">
                  <strong className="block text-base font-semibold mb-0.5">Maria K.</strong>
                  <span className="text-sm opacity-80">Founder at TechStart, Mumbai, India</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;