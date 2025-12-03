import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PersonalInfoStep from './PersonalInfoStep';
import ApplicationDetailsStep from './ApplicationDetailsStep';
import SuccessModal from './SuccessModal';

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    picture: '',
    resume: '',
  });

  // Job data
  const [jobData, setJobData] = useState(null);

  // Application data
  const [applicationData, setApplicationData] = useState({
    contactEmail: '',
    skillRating: '',
    availability: 'immediate',
    coverMessage: '',
  });

  useEffect(() => {
    // Redirect if not a freelancer
    if (user && user.role !== 'Freelancer') {
      navigate('/jobs');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch freelancer profile
      const profileResponse = await fetch('http://localhost:9000/api/freelancer/profile', {
        credentials: 'include',
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileResult = await profileResponse.json();
      if (profileResult.success) {
        setProfileData(profileResult.data);
      }

      // Fetch job details
      const jobResponse = await fetch(`http://localhost:9000/api/jobs/api/${jobId}`);
      if (!jobResponse.ok) {
        throw new Error('Failed to fetch job details');
      }

      const jobResult = await jobResponse.json();
      if (jobResult.success) {
        setJobData(jobResult.job);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfileData({ ...profileData, ...updatedProfile });
  };

  const handleApplicationSubmit = async (appData) => {
    try {
      const response = await fetch(`http://localhost:9000/api/freelancer/apply/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          coverMessage: appData.coverMessage,
          skillRating: appData.skillRating,
          availability: appData.availability,
          contactEmail: appData.contactEmail || profileData.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      if (result.success) {
        setShowSuccessModal(true);
        // Redirect after 4 seconds
        setTimeout(() => {
          navigate('/jobs');
        }, 4000);
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/jobs')} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header - Fixed Sticky */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="text-4xl font-bold text-gray-900">
              <Link to="/" className="hover:text-blue-700 transition-colors">
                Mile<span className="text-blue-700">stone</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              {user ? (
                <Link
                  to={user.role === 'Admin' ? '/admin/profile' : user.role === 'Employer' ? '/employer/profile' : '/freelancer/profile'}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Personal Info</span>
            </div>
            <div className={`w-24 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Application Details</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          {currentStep === 1 && (
            <PersonalInfoStep
              profileData={profileData}
              onUpdate={handleProfileUpdate}
              onNext={handleNext}
            />
          )}

          {currentStep === 2 && (
            <ApplicationDetailsStep
              jobData={jobData}
              applicationData={applicationData}
              setApplicationData={setApplicationData}
              onBack={handleBack}
              onSubmit={handleApplicationSubmit}
            />
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/jobs');
          }}
        />
      )}
    </div>
  );
};

export default JobApplication;
