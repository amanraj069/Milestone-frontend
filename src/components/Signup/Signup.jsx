import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SignupForm from './SignupForm';
import BrandSide from './BrandSide';

const Signup = () => {
  // Step 1: Basic info, Step 2: OTP verification, Step 3: Password
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
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { signup, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

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

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    
    const result = await sendOtp(formData.email, formData.name);
    
    if (result.success) {
      setCurrentStep(2); // Move to OTP verification step
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
      setCurrentStep(3); // Move to password step
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendDisabled) return;
    setLoading(true);
    setError('');
    
    const result = await sendOtp(formData.email, formData.name);
    
    if (result.success) {
      startResendTimer();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.role) {
      setError('Please select your role');
      return;
    }
    
    // Send OTP when proceeding to verification
    await handleSendOtp();
  };

  const handlePrevStep = () => {
    setError('');
    if (currentStep === 2) {
      setCurrentStep(1);
      setFormData(prev => ({ ...prev, otp: '' }));
    } else if (currentStep === 3) {
      // Go back to step 1 (can't go back to OTP step as it's already verified)
      setCurrentStep(1);
      setFormData(prev => ({ ...prev, otp: '', password: '', confirmPassword: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (currentStep !== 3) {
      setError('Please complete email verification first');
      setLoading(false);
      return;
    }
    
    if (!formData.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    const { confirmPassword, otp, ...submitData } = formData;
    const result = await signup(submitData);
    if (result.success) {
      navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="milestone-auth">
      <div className="auth-split-container">
        <div className="auth-form-side">
          <SignupForm
            currentStep={currentStep}
            formData={formData}
            error={error}
            loading={loading}
            resendDisabled={resendDisabled}
            resendTimer={resendTimer}
            handleChange={handleChange}
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
            handleSubmit={handleSubmit}
            handleVerifyOtp={handleVerifyOtp}
            handleResendOtp={handleResendOtp}
          />
        </div>
        <div className="auth-brand-side">
          <BrandSide />
        </div>
      </div>
    </div>
  );
};

export default Signup;
