import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import DashboardPage from '../../../components/DashboardPage';
import { computeFees } from '../../../components/employer/BoostJobModal';
import FeePaymentModal from '../../../components/employer/FeePaymentModal';
import PaymentProcessingModal from '../../../components/employer/PaymentProcessingModal';

// Validation schema for Step 1 - Job Details
const jobDetailsSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(5, 'Job title must be at least 5 characters')
    .max(100, 'Job title must be less than 100 characters')
    .required('Job title is required'),
  budget: Yup.number()
    .typeError('Budget must be a number')
    .positive('Budget must be greater than 0')
    .min(100, 'Budget must be at least ₹100')
    .max(10000000, 'Budget cannot exceed ₹1,00,00,000')
    .required('Budget is required'),
  location: Yup.string()
    .trim()
    .max(100, 'Location must be less than 100 characters'),
  jobType: Yup.string()
    .oneOf(['full-time', 'part-time', 'contract', 'freelance'], 'Please select a valid job type')
    .required('Job type is required'),
  experienceLevel: Yup.string()
    .oneOf(['Entry', 'Mid', 'Senior', 'Expert'], 'Please select a valid experience level')
    .required('Experience level is required'),
  remote: Yup.boolean(),
  applicationDeadline: Yup.date()
    .typeError('Please enter a valid date')
    .min(new Date(), 'Deadline must be a future date')
    .required('Application deadline is required'),
  descriptionText: Yup.string()
    .trim()
    .min(50, 'Job description must be at least 50 characters')
    .max(5000, 'Job description must be less than 5000 characters')
    .required('Job description is required'),
  responsibilities: Yup.string()
    .max(3000, 'Responsibilities must be less than 3000 characters'),
  requirements: Yup.string()
    .max(3000, 'Requirements must be less than 3000 characters'),
  skills: Yup.string()
    .trim()
    .test('min-skills', 'Please enter at least one skill', (value) => {
      if (!value) return false;
      const skills = value.split(',').map(s => s.trim()).filter(s => s);
      return skills.length >= 1;
    })
    .test('max-skills', 'Maximum 20 skills allowed', (value) => {
      if (!value) return true;
      const skills = value.split(',').map(s => s.trim()).filter(s => s);
      return skills.length <= 20;
    })
    .required('At least one skill is required'),
  imageUrl: Yup.string()
    .url('Please enter a valid URL')
    .nullable()
});

// Validation schema for a single milestone
const milestoneSchema = Yup.object().shape({
  description: Yup.string()
    .trim()
    .min(5, 'Milestone description must be at least 5 characters')
    .max(500, 'Milestone description must be less than 500 characters'),
  deadline: Yup.date()
    .typeError('Please enter a valid date')
    .min(new Date(), 'Deadline must be a future date'),
  payment: Yup.number()
    .typeError('Payment must be a number')
    .positive('Payment must be greater than 0')
    .min(100, 'Minimum payment is ₹100'),
  subTasks: Yup.array().of(
    Yup.object().shape({
      description: Yup.string()
        .trim()
        .max(200, 'Sub-task description must be less than 200 characters')
    })
  )
});

const AddJob = () => {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_BACKEND_URL;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showFeePaymentModal, setShowFeePaymentModal] = useState(false);
  const [showPaymentProcessing, setShowPaymentProcessing] = useState(false);
  const [pendingJobData, setPendingJobData] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    budget: '',
    location: '',
    jobType: '',
    experienceLevel: '',
    remote: false,
    applicationDeadline: '',
    descriptionText: '',
    responsibilities: '',
    requirements: '',
    skills: '',
    imageUrl: '',
    // Fee & boost options
    isBoosted: false,
    applicationCap: '', // '' = unlimited
  });

  const [milestones, setMilestones] = useState([
    {
      description: '',
      deadline: '',
      payment: '',
      subTasks: [{ description: '' }]
    }
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      {
        description: '',
        deadline: '',
        payment: '',
        subTasks: [{ description: '' }]
      }
    ]);
  };

  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const addSubTask = (milestoneIndex) => {
    const updated = [...milestones];
    updated[milestoneIndex].subTasks.push({ description: '' });
    setMilestones(updated);
  };

  const removeSubTask = (milestoneIndex, subTaskIndex) => {
    const updated = [...milestones];
    updated[milestoneIndex].subTasks = updated[milestoneIndex].subTasks.filter((_, i) => i !== subTaskIndex);
    setMilestones(updated);
  };

  const updateSubTask = (milestoneIndex, subTaskIndex, value) => {
    const updated = [...milestones];
    updated[milestoneIndex].subTasks[subTaskIndex].description = value;
    setMilestones(updated);
  };

  // Determines whether the Review & Pay button should be enabled.
  // Rules:
  //   1. At least one milestone must be fully filled.
  //   2. No milestone may be partially filled — if any field is touched, all
  //      three main fields (description ≥ 5 chars, deadline, payment ≥ ₹100) are required.
  //   3. The sum of all milestone payments must exactly equal the total budget.
  const areMilestonesValid = useMemo(() => {
    for (const m of milestones) {
      const hasAnyField = m.description || m.deadline || m.payment;
      if (!hasAnyField) continue;

      // All three fields must be present
      if (!m.description?.trim() || !m.deadline || !m.payment) return false;

      // Description must be at least 5 chars
      if (m.description.trim().length < 5) return false;

      // Payment must be a valid positive number ≥ ₹100
      const paymentVal = parseFloat(m.payment);
      if (isNaN(paymentVal) || paymentVal < 100) return false;
    }

    // At least one milestone must be fully filled
    const filledMilestones = milestones.filter(
      m => m.description?.trim() && m.deadline && m.payment
    );
    if (filledMilestones.length === 0) return false;

    // Total milestone payments must equal the project budget
    const totalMilestonePayment = filledMilestones.reduce(
      (sum, m) => sum + parseFloat(m.payment || 0),
      0
    );
    const totalBudget = parseFloat(formData.budget || 0);
    if (Math.abs(totalMilestonePayment - totalBudget) > 0.01) return false;

    return true;
  }, [milestones, formData.budget]);

  const handleNextStep = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    try {
      // Validate Step 1 fields using Yup schema
      await jobDetailsSchema.validate(formData, { abortEarly: false });
      setCurrentStep(2);
    } catch (err) {
      if (err.inner) {
        // Collect all field errors
        const errors = {};
        err.inner.forEach(error => {
          if (!errors[error.path]) {
            errors[error.path] = error.message;
          }
        });
        setFieldErrors(errors);
        // Set the first error as the main error
        setError(err.inner[0]?.message || 'Please fix the errors below');
      } else {
        setError(err.message);
      }
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    setError('');
    setFieldErrors({});
  };

  // Validate milestones
  const validateMilestones = async () => {
    const filledMilestones = milestones.filter(m => m.description || m.deadline || m.payment);
    
    for (let i = 0; i < filledMilestones.length; i++) {
      const milestone = filledMilestones[i];
      
      // If any field is filled, require all main fields
      if (milestone.description || milestone.deadline || milestone.payment) {
        if (!milestone.description?.trim()) {
          throw new Error(`Milestone ${i + 1}: Description is required`);
        }
        if (!milestone.deadline) {
          throw new Error(`Milestone ${i + 1}: Deadline is required`);
        }
        if (!milestone.payment || parseFloat(milestone.payment) <= 0) {
          throw new Error(`Milestone ${i + 1}: Valid payment amount is required`);
        }
        
        // Validate against schema
        try {
          await milestoneSchema.validate(milestone, { abortEarly: false });
        } catch (err) {
          if (err.inner && err.inner.length > 0) {
            throw new Error(`Milestone ${i + 1}: ${err.inner[0].message}`);
          }
        }
      }
    }
    
    return filledMilestones;
  };

  // Step 2 submit — validate then open payment modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Validate milestones
      const filledMilestones = await validateMilestones();

      // Validate milestone payments match budget
      if (filledMilestones.length > 0) {
        const totalMilestonePayment = filledMilestones.reduce((sum, m) => sum + parseFloat(m.payment || 0), 0);
        const totalBudget = parseFloat(formData.budget);
        if (Math.abs(totalMilestonePayment - totalBudget) > 0.01) {
          setError(`Milestone payments (₹${totalMilestonePayment.toLocaleString('en-IN')}) must equal the total budget (₹${totalBudget.toLocaleString('en-IN')})`);
          return;
        }
      }

      // Build job payload and park it — actual POST happens after payment
      const jobData = {
        title: formData.title,
        budget: parseFloat(formData.budget),
        location: formData.location,
        jobType: formData.jobType,
        experienceLevel: formData.experienceLevel,
        remote: formData.remote,
        applicationDeadline: formData.applicationDeadline,
        description: {
          text: formData.descriptionText,
          responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
          requirements: formData.requirements.split('\n').filter(r => r.trim()),
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
        },
        imageUrl: formData.imageUrl || '/assets/company_logo.jpg',
        milestones: milestones
          .filter(m => m.description && m.deadline && m.payment)
          .map(m => ({
            description: m.description,
            deadline: m.deadline,
            payment: m.payment,
            status: 'not-paid',
            requested: false,
            subTasks: m.subTasks
              .filter(st => st.description.trim())
              .map(st => ({
                description: st.description,
                status: 'pending',
                completedDate: null,
                notes: ''
              })),
            completionPercentage: 0
          })),
        isBoosted: formData.isBoosted,
        applicationCap: formData.applicationCap === '' ? null : parseInt(formData.applicationCap),
      };

      setPendingJobData(jobData);
      setShowFeePaymentModal(true);
    } catch (err) {
      setError(err.message || 'Please fix the errors above');
    }
  };

  // Called when payment card form is submitted (or fee is 0)
  const handlePaymentConfirm = (paymentDetails) => {
    setShowFeePaymentModal(false);
    setShowPaymentProcessing(true);
  };

  // Called when PaymentProcessingModal finishes its animation
  const handlePaymentProcessingComplete = async () => {
    setShowPaymentProcessing(false);
    if (!pendingJobData) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/api/employer/job-listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pendingJobData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        navigate('/employer/job-listings');
      } else {
        setError(data.error || 'Failed to create job listing');
        setCurrentStep(2);
      }
    } catch (err) {
      console.error('Error creating job:', err);
      setError('Network error. Please try again.');
      setCurrentStep(2);
    } finally {
      setLoading(false);
      setPendingJobData(null);
    }
  };

  const headerAction = (
    <div className="flex items-center gap-4">
      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {currentStep > 1 ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : '1'}
          </div>
          <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
            Job Details
          </span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
          <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
            Milestones
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardPage title="Post New Job" headerAction={headerAction}>
      <p className="text-gray-500 -mt-6 mb-6">Fill in the details to create a new job listing</p>

      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Show error at top only for Step 1 */}
          {currentStep === 1 && error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Job Details */}
          {currentStep === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  placeholder="e.g., Senior React Developer"
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {fieldErrors.title ? (
                    <p className="text-red-500 text-xs">{fieldErrors.title}</p>
                  ) : (
                    <p className="text-xs text-gray-500">Min 5 characters</p>
                  )}
                  <p className={`text-xs ${formData.title.length >= 5 ? 'text-green-600' : 'text-gray-400'}`}>
                    {formData.title.length}/100 {formData.title.length < 5 && `(need ${5 - formData.title.length} more)`}
                  </p>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Budget (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="e.g., 50000"
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.budget ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.budget && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.budget}</p>
                )}
              </div>

              {/* Location and Remote */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="e.g., Mumbai, India"
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.location ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    {fieldErrors.location ? (
                      <p className="text-red-500 text-xs">{fieldErrors.location}</p>
                    ) : (
                      <span></span>
                    )}
                    <p className="text-xs text-gray-400">{formData.location.length}/100</p>
                  </div>
                </div>
                <div className="flex items-center pt-7">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="remote"
                      checked={formData.remote}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remote Work Available</span>
                  </label>
                </div>
              </div>

              {/* Job Type and Experience Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Job Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.jobType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select job type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </select>
                  {fieldErrors.jobType && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.jobType}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Experience Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.experienceLevel ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select experience level</option>
                    <option value="Entry">Entry Level</option>
                    <option value="Mid">Mid Level</option>
                    <option value="Senior">Senior Level</option>
                    <option value="Expert">Expert Level</option>
                  </select>
                  {fieldErrors.experienceLevel && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.experienceLevel}</p>
                  )}
                </div>
              </div>

              {/* Application Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Application Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.applicationDeadline ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.applicationDeadline && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.applicationDeadline}</p>
                )}
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="descriptionText"
                  value={formData.descriptionText}
                  onChange={handleChange}
                  required
                  rows="4"
                  maxLength={5000}
                  placeholder="Provide a detailed description of the job..."
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    fieldErrors.descriptionText ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                ></textarea>
                <div className="flex justify-between mt-1">
                  {fieldErrors.descriptionText ? (
                    <p className="text-red-500 text-xs">{fieldErrors.descriptionText}</p>
                  ) : (
                    <p className="text-xs text-gray-500">Min 50 characters</p>
                  )}
                  <p className={`text-xs ${formData.descriptionText.length >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                    {formData.descriptionText.length}/5000 {formData.descriptionText.length < 50 && `(need ${50 - formData.descriptionText.length} more)`}
                  </p>
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Key Responsibilities
                </label>
                <textarea
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleChange}
                  rows="3"
                  maxLength={3000}
                  placeholder="Enter each responsibility on a new line..."
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    fieldErrors.responsibilities ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                ></textarea>
                <div className="flex justify-between mt-1">
                  {fieldErrors.responsibilities ? (
                    <p className="text-red-500 text-xs">{fieldErrors.responsibilities}</p>
                  ) : (
                    <p className="text-xs text-gray-500">One responsibility per line</p>
                  )}
                  <p className="text-xs text-gray-400">{formData.responsibilities.length}/3000</p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows="3"
                  maxLength={3000}
                  placeholder="Enter each requirement on a new line..."
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    fieldErrors.requirements ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                ></textarea>
                <div className="flex justify-between mt-1">
                  {fieldErrors.requirements ? (
                    <p className="text-red-500 text-xs">{fieldErrors.requirements}</p>
                  ) : (
                    <p className="text-xs text-gray-500">One requirement per line</p>
                  )}
                  <p className="text-xs text-gray-400">{formData.requirements.length}/3000</p>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Required Skills <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  required
                  placeholder="e.g., React, Node.js, MongoDB, TypeScript"
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.skills ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {fieldErrors.skills ? (
                    <p className="text-red-500 text-xs">{fieldErrors.skills}</p>
                  ) : (
                    <p className="text-xs text-gray-500">Separate skills with commas (max 20)</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {formData.skills ? formData.skills.split(',').filter(s => s.trim()).length : 0} skills
                  </p>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Logo URL (Optional)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.imageUrl ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.imageUrl && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.imageUrl}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/employer/job-listings')}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Next: Add Milestones →
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Milestones */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-base font-semibold text-gray-900">Project Milestones</h2>
                <p className="text-sm text-gray-500 mt-0.5">Break down your project into manageable milestones (Optional)</p>
              </div>

              {/* ── Platform Fee & Boost Options (moved here from Step 1) ── */}
              {(() => {
                const budget = parseFloat(formData.budget) || 0;
                const appCap = formData.applicationCap === '' ? null : parseInt(formData.applicationCap);
                const fees = computeFees(budget, formData.isBoosted, appCap);
                return (
                  <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                          <i className="fas fa-sliders text-white text-sm"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Platform Fee &amp; Boost Options</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Set applicant limits and optionally boost your listing.</p>
                        </div>
                      </div>
                    </div>

                    {/* Two-column body */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">

                      {/* LEFT: Controls */}
                      <div className="p-5 space-y-5 bg-white">
                        {/* Application Cap */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Application Cap</label>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">limit applicants</span>
                          </div>
                          <div className="relative">
                            <select
                              name="applicationCap"
                              value={formData.applicationCap}
                              onChange={handleChange}
                              className="w-full appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                              <option value="">Unlimited applications (+2% fee)</option>
                              <option value="50">Up to 50 applicants (+1% fee)</option>
                              <option value="25">Up to 25 applicants (+0.5% fee)</option>
                              <option value="10">Up to 10 applicants (0% fee)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                              <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                            <i className="fas fa-circle-info text-gray-300 text-[11px]"></i>
                            Fewer applications allowed = lower cap fee
                          </p>
                        </div>

                        {/* Boost Toggle */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Boost</label>
                            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100 font-medium">Optional</span>
                          </div>
                          <label className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.isBoosted ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm shadow-amber-100' : 'border-gray-200 bg-gray-50 hover:border-amber-200 hover:bg-amber-50/40'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${formData.isBoosted ? 'bg-amber-400 shadow-md shadow-amber-200' : 'bg-white border border-gray-200'}`}>
                              <i className={`fas fa-bolt text-sm ${formData.isBoosted ? 'text-white' : 'text-gray-400'}`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-gray-800">Boost this job posting</span>
                                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${formData.isBoosted ? 'bg-amber-400' : 'bg-gray-200'}`}>
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${formData.isBoosted ? 'translate-x-6' : 'translate-x-1'}`}></div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                Ranks above premium listings for the full job duration. Only "Premium + Boosted" ranks higher.
                              </p>
                              <div className="mt-2">
                                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">+2% fee · 4% total</span>
                              </div>
                            </div>
                            <input type="checkbox" name="isBoosted" checked={formData.isBoosted} onChange={handleChange} className="sr-only" />
                          </label>
                        </div>
                      </div>

                      {/* RIGHT: Fee Summary */}
                      <div className="p-5 bg-gray-50/60 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                            <i className="fas fa-receipt text-gray-400"></i>
                            Fee Summary
                          </p>
                          {budget <= 0 && <span className="text-xs text-gray-400 italic">enter budget to see amounts</span>}
                        </div>
                        <div className="flex-1 flex flex-col gap-2.5">
                          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <i className="fas fa-percent text-blue-500 text-xs"></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-700">Platform fee</p>
                              <span className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded mt-0.5 ${formData.isBoosted ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                                {formData.isBoosted ? '4% — boosted' : '2% — standard'}
                              </span>
                            </div>
                            <span className="text-sm font-semibold font-mono text-gray-800 shrink-0">
                              {budget > 0 ? `₹${((fees.platformFeeRate / 100) * budget).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <span className="text-gray-300 font-sans text-base">—</span>}
                            </span>
                          </div>
                          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <i className="fas fa-users text-purple-400 text-xs"></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-700">Application cap fee</p>
                              <span className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded mt-0.5 bg-purple-50 text-purple-600">{fees.applicationCapFeeRate}%</span>
                            </div>
                            <span className="text-sm font-semibold font-mono text-gray-800 shrink-0">
                              {budget > 0 ? `₹${((fees.applicationCapFeeRate / 100) * budget).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <span className="text-gray-300 font-sans text-base">—</span>}
                            </span>
                          </div>
                          <div className={`rounded-xl px-4 py-4 flex items-center justify-between transition-all duration-300 ${formData.isBoosted ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-amber-200/50' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-200/50'}`}>
                            <div>
                              <p className="text-xs font-semibold text-white/70">Total platform fee</p>
                              <p className="text-2xl font-bold text-white leading-tight">{fees.totalFeeRate}%</p>
                              <p className="text-xs text-white/60 mt-0.5">of project budget</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/60 mb-0.5">you pay</p>
                              <p className="text-xl font-bold text-white font-mono">
                                {budget > 0 ? `₹${fees.platformFeeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                              </p>
                            </div>
                          </div>
                          {formData.isBoosted && (
                            <div className="bg-amber-50 rounded-xl border border-amber-100 px-4 py-3 space-y-1.5">
                              <p className="text-xs font-semibold text-amber-800 mb-2">Boost includes</p>
                              <div className="flex items-center gap-2 text-xs text-amber-700"><i className="fas fa-check-circle text-amber-500 text-[11px]"></i> Lifetime boost — active for full job duration</div>
                              <div className="flex items-center gap-2 text-xs text-amber-700"><i className="fas fa-check-circle text-amber-500 text-[11px]"></i> Top placement above all standard &amp; premium listings</div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}
              
              {/* Show error at top only for non-milestone errors */}
              {error && !error.includes('Milestone payments') && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Budget Tracker */}
              {(() => {
                const filledMilestones = milestones.filter(m => m.payment);
                const totalMilestonePayment = filledMilestones.reduce((sum, m) => sum + parseFloat(m.payment || 0), 0);
                const totalBudget = parseFloat(formData.budget || 0);
                const remaining = totalBudget - totalMilestonePayment;
                const isValid = Math.abs(remaining) < 0.01;
                
                if (filledMilestones.length > 0) {
                  return (
                    <div className={`p-4 rounded-lg border ${
                      isValid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Budget</p>
                          <p className="font-semibold text-gray-900">₹{totalBudget.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Milestone Payments</p>
                          <p className="font-semibold text-gray-900">₹{totalMilestonePayment.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Remaining</p>
                          <p className={`font-semibold ${isValid ? 'text-green-600' : remaining < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                            ₹{Math.abs(remaining).toLocaleString('en-IN')}
                            {isValid && ' ✓'}
                          </p>
                        </div>
                      </div>
                      {!isValid && (
                        <p className="text-xs text-gray-600 mt-2">
                          {remaining > 0 ? 'Milestone payments should equal the total budget' : 'Milestone payments exceed the total budget'}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              <div className="space-y-4">
                {milestones.map((milestone, mIndex) => (
                  <div key={mIndex} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          {mIndex + 1}
                        </span>
                        Milestone {mIndex + 1}
                      </h4>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(mIndex)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Milestone Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Description
                        </label>
                        <input
                          type="text"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(mIndex, 'description', e.target.value)}
                          placeholder="e.g., Complete UI Design Phase"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Milestone Deadline */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Deadline
                          </label>
                          <input
                            type="date"
                            value={milestone.deadline}
                            onChange={(e) => updateMilestone(mIndex, 'deadline', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Milestone Payment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Payment (₹)
                          </label>
                          <input
                            type="number"
                            value={milestone.payment}
                            onChange={(e) => updateMilestone(mIndex, 'payment', e.target.value)}
                            min="0"
                            placeholder="e.g., 15000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Sub-tasks */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-700">Sub-tasks</label>
                          <button
                            type="button"
                            onClick={() => addSubTask(mIndex)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            + Add
                          </button>
                        </div>

                        <div className="space-y-2">
                          {milestone.subTasks.map((subTask, stIndex) => (
                            <div key={stIndex} className="flex gap-2 items-center">
                              <span className="text-gray-400 text-xs w-4">{stIndex + 1}.</span>
                              <input
                                type="text"
                                value={subTask.description}
                                onChange={(e) => updateSubTask(mIndex, stIndex, e.target.value)}
                                placeholder={`Sub-task ${stIndex + 1}`}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              {milestone.subTasks.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSubTask(mIndex, stIndex)}
                                  className="text-red-500 hover:text-red-700 px-2"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={addMilestone}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  + Add Another Milestone
                </button>
              </div>

              {/* Milestone Payment Validation Error */}
              {error && error.includes('Milestone payments') && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !areMilestonesValid}
                  title={!areMilestonesValid ? 'Fill in all milestone fields completely (description ≥ 5 chars, deadline, payment ≥ ₹100) and ensure the total payments equal the project budget.' : ''}
                  className={`flex-1 px-4 py-2 text-white rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    loading || !areMilestonesValid
                      ? 'bg-gray-400 cursor-not-allowed opacity-70'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> Publishing...</>
                  ) : (
                    <><i className="fas fa-lock text-xs opacity-75"></i> Review &amp; Pay →</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Fee Payment Modal ── */}
      {(() => {
        const budget = parseFloat(formData.budget) || 0;
        const appCap = formData.applicationCap === '' ? null : parseInt(formData.applicationCap);
        const fees = computeFees(budget, formData.isBoosted, appCap);
        return (
          <FeePaymentModal
            isOpen={showFeePaymentModal}
            onClose={() => setShowFeePaymentModal(false)}
            onConfirm={handlePaymentConfirm}
            fees={fees}
            budget={budget}
            isBoosted={formData.isBoosted}
          />
        );
      })()}

      {/* ── Payment Processing Spinner ── */}
      <PaymentProcessingModal
        isOpen={showPaymentProcessing}
        onComplete={handlePaymentProcessingComplete}
      />
    </DashboardPage>
  );
};

export default AddJob;
