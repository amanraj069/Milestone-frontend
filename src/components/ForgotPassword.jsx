import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  // Step 1: Email, Step 2: OTP Verification, Step 3: New Password
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);
  
  const { forgotPasswordSendOtp, forgotPasswordVerifyOtp, resetPassword } = useAuth();
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
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Real-time validation
    if (name === 'email') {
      if (value.trim() === '') {
        setFieldErrors(prev => ({ ...prev, email: 'Email is required' }));
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      } else {
        setFieldErrors(prev => ({ ...prev, email: '' }));
      }
    } else if (name === 'newPassword') {
      if (value === '') {
        setFieldErrors(prev => ({ ...prev, newPassword: 'Password is required' }));
      } else if (value.length < 6) {
        setFieldErrors(prev => ({ ...prev, newPassword: 'Password must be at least 6 characters' }));
      } else if (!/[A-Z]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, newPassword: 'Password must contain at least one capital letter' }));
      } else if (!/[0-9]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, newPassword: 'Password must contain at least one digit' }));
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, newPassword: 'Password must contain at least one special character' }));
      } else {
        setFieldErrors(prev => ({ ...prev, newPassword: '' }));
      }
      // Check confirm password match
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else if (formData.confirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    } else if (name === 'confirmPassword') {
      if (value === '') {
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      } else if (value !== formData.newPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
    
    setError('');
  };

  // Handle individual OTP digit input
  const handleOtpDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = digit;
    setOtpDigits(newOtpDigits);
    
    const combinedOtp = newOtpDigits.join('');
    setFormData(prev => ({ ...prev, otp: combinedOtp }));
    setError('');
    
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
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
      
      const focusIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', newPassword: '', confirmPassword: '' });

    if (!formData.email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    setLoading(true);
    const result = await forgotPasswordSendOtp(formData.email);
    
    if (result.success) {
      setCurrentStep(2);
      startResendTimer();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await forgotPasswordVerifyOtp(formData.email, formData.otp);
    
    if (result.success) {
      setCurrentStep(3);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendDisabled) return;
    setLoading(true);
    setError('');
    
    const result = await forgotPasswordSendOtp(formData.email);
    
    if (result.success) {
      startResendTimer();
      setOtpDigits(['', '', '', '', '', '']);
      setFormData(prev => ({ ...prev, otp: '' }));
      otpInputRefs.current[0]?.focus();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));

    let hasErrors = false;

    if (!formData.newPassword) {
      setFieldErrors(prev => ({ ...prev, newPassword: 'Password is required' }));
      hasErrors = true;
    } else if (formData.newPassword.length < 6) {
      setFieldErrors(prev => ({ ...prev, newPassword: 'Password must be at least 6 characters' }));
      hasErrors = true;
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      setFieldErrors(prev => ({ ...prev, newPassword: 'Password must contain at least one capital letter' }));
      hasErrors = true;
    } else if (!/[0-9]/.test(formData.newPassword)) {
      setFieldErrors(prev => ({ ...prev, newPassword: 'Password must contain at least one digit' }));
      hasErrors = true;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)) {
      setFieldErrors(prev => ({ ...prev, newPassword: 'Password must contain at least one special character' }));
      hasErrors = true;
    }
    
    if (!formData.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      hasErrors = true;
    } else if (formData.newPassword !== formData.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      hasErrors = true;
    }

    if (hasErrors) return;

    setLoading(true);
    const result = await resetPassword(formData.email, formData.otp, formData.newPassword);
    
    if (result.success) {
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handlePrevStep = () => {
    setError('');
    if (currentStep === 2) {
      setCurrentStep(1);
      setOtpDigits(['', '', '', '', '', '']);
      setFormData(prev => ({ ...prev, otp: '' }));
    } else if (currentStep === 3) {
      setCurrentStep(2);
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    }
    setFieldErrors({ email: '', newPassword: '', confirmPassword: '' });
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

            {/* Step 1: Email Input */}
            {currentStep === 1 && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                  <p className="text-base text-gray-600">Enter your email to receive an OTP</p>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 flex items-center gap-2 text-sm font-medium">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your registered email"
                      autoComplete="email"
                      autoFocus
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

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-3.5 rounded-lg font-semibold cursor-pointer transition-all text-base inline-flex items-center justify-center gap-2 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white w-full hover:from-navy-900 hover:via-navy-800 hover:to-navy-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP</span>
                        <i className="fas fa-paper-plane"></i>
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-8 text-base text-gray-600">
                  <span>Remember your password? </span>
                  <Link to="/login" className="text-blue-500 no-underline font-semibold hover:underline">Sign in</Link>
                </div>
              </>
            )}

            {/* Step 2: OTP Verification */}
            {currentStep === 2 && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify OTP</h2>
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
                        <span>Verify OTP</span>
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
                    <span>Change Email</span>
                  </button>
                </div>
              </>
            )}

            {/* Step 3: New Password */}
            {currentStep === 3 && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                  <p className="text-base text-gray-600">Create a new strong password</p>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                    <i className="fas fa-check"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-emerald-800">Email Verified</div>
                    <div className="text-xs text-emerald-600">{formData.email}</div>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 flex items-center gap-2 text-sm font-medium">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-lg mb-5 flex items-center gap-2 text-sm font-medium">
                    <i className="fas fa-check-circle"></i>
                    {success}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        autoComplete="off"
                        autoFocus
                        className={`px-4 py-3 pr-12 border-2 rounded-lg text-base bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400 w-full ${
                          fieldErrors.newPassword 
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                            : formData.newPassword && 
                              formData.newPassword.length >= 6 && 
                              /[A-Z]/.test(formData.newPassword) && 
                              /[0-9]/.test(formData.newPassword) && 
                              /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)
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
                    {fieldErrors.newPassword ? (
                      <div className="text-rose-600 text-xs mt-1">
                        {fieldErrors.newPassword}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">
                        Min 6 characters, 1 capital, 1 digit, 1 special character
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
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
                            : formData.confirmPassword && formData.confirmPassword === formData.newPassword
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

                  <div className="flex gap-3 mt-4">
                    <button 
                      type="button" 
                      onClick={handlePrevStep} 
                      className="px-6 py-3.5 rounded-lg font-semibold cursor-pointer transition-all text-base inline-flex items-center justify-center gap-2 bg-transparent border-2 border-navy-700 text-navy-700 hover:bg-navy-700 hover:text-white hover:-translate-y-0.5 flex-none min-w-[100px]"
                    >
                      <i className="fas fa-arrow-left"></i>
                      <span>Back</span>
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1 px-6 py-3.5 rounded-lg font-semibold cursor-pointer transition-all text-base inline-flex items-center justify-center gap-2 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white hover:from-navy-900 hover:via-navy-800 hover:to-navy-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>Resetting...</span>
                        </>
                      ) : (
                        <>
                          <span>Change Password</span>
                          <i className="fas fa-key"></i>
                        </>
                      )}
                    </button>
                  </div>
                </form>
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
              <h2 className="text-2xl font-semibold leading-snug opacity-95">Secure your account. Reset your password safely.</h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-shield-alt text-4xl"></i>
                </div>
              </div>
              <p className="text-base leading-relaxed opacity-90">
                Your security is our priority. We use secure OTP verification to ensure only you can reset your password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
