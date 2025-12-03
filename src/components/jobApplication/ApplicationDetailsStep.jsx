import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ApplicationDetailsStep = ({ jobData, applicationData, setApplicationData, onBack, onSubmit }) => {
  const navigate = useNavigate();
  const [lastCoverMessage, setLastCoverMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch last used cover message
    const fetchLastCoverMessage = async () => {
      try {
        const response = await fetch('http://localhost:9000/api/freelancer/cover-message/last', {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.success && result.data.lastCoverMessage) {
          setLastCoverMessage(result.data.lastCoverMessage);
        }
      } catch (err) {
        console.error('Error fetching last cover message:', err);
      }
    };

    fetchLastCoverMessage();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData({
      ...applicationData,
      [name]: value,
    });
    setError('');
  };

  const handleUseLastCoverMessage = () => {
    if (lastCoverMessage) {
      setApplicationData({
        ...applicationData,
        coverMessage: lastCoverMessage,
      });
    }
  };

  const validateAndSubmit = async () => {
    // Validate cover message
    if (!applicationData.coverMessage || applicationData.coverMessage.length < 50) {
      setError('Cover message must be at least 50 characters long');
      return;
    }

    if (!applicationData.skillRating) {
      setError('Please rate your expertise level');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onSubmit(applicationData);
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  // Get first skill from job requirements
  const firstSkill = jobData?.description?.skills?.[0] || 'this skill';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Application Details</h2>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Job Summary Card */}
      <div className="bg-blue-600 text-white rounded-lg p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className="flex-shrink-0">
            {jobData?.imageUrl ? (
              <img src={jobData.imageUrl} alt="Company" className="w-16 h-16 rounded-lg object-cover bg-white" />
            ) : (
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">{jobData?.title}</h3>
            <div className="flex flex-wrap gap-4 text-sm text-blue-100">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {jobData?.location || 'Remote'}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                Rs. {jobData?.budget?.amount || jobData?.budget}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-blue-100 mt-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Deadline: {jobData?.applicationDeadline ? new Date(jobData.applicationDeadline).toLocaleDateString() : 'N/A'}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {jobData?.jobType}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/jobs/${jobData?.jobId}`)}
          className="text-blue-100 hover:text-white flex items-center space-x-1 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>See full job description</span>
        </button>
      </div>

      {/* Skill Rating */}
      <div className="space-y-2">
        <label htmlFor="skillRating" className="block text-sm font-medium text-gray-700">
          Rate your expertise in {firstSkill} <span className="text-red-600">*</span>
        </label>
        <select
          id="skillRating"
          name="skillRating"
          value={applicationData.skillRating}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select your expertise level (1-5)</option>
          <option value="1">1 - Beginner</option>
          <option value="2">2 - Elementary</option>
          <option value="3">3 - Intermediate</option>
          <option value="4">4 - Advanced</option>
          <option value="5">5 - Expert</option>
        </select>
      </div>

      {/* Availability */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Confirm your availability <span className="text-red-600">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-start space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="availability"
              value="immediate"
              checked={applicationData.availability === 'immediate'}
              onChange={handleInputChange}
              className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Yes, I am available to join immediately</span>
          </label>
          <label className="flex items-start space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="availability"
              value="notice"
              checked={applicationData.availability === 'notice'}
              onChange={handleInputChange}
              className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">No, I am currently on notice period</span>
          </label>
          <label className="flex items-start space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="availability"
              value="serve-notice"
              checked={applicationData.availability === 'serve-notice'}
              onChange={handleInputChange}
              className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">No, I will have to serve notice period</span>
          </label>
          <label className="flex items-start space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="availability"
              value="other"
              checked={applicationData.availability === 'other'}
              onChange={handleInputChange}
              className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Other (please specify in cover message)</span>
          </label>
        </div>
      </div>

      {/* Cover Message */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="coverMessage" className="block text-sm font-medium text-gray-700">
            Cover Message <span className="text-red-600">*</span>
          </label>
          {lastCoverMessage && (
            <button
              type="button"
              onClick={handleUseLastCoverMessage}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Use last cover message</span>
            </button>
          )}
        </div>
        <textarea
          id="coverMessage"
          name="coverMessage"
          value={applicationData.coverMessage}
          onChange={handleInputChange}
          rows="6"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Tell the employer why you're the perfect fit for this job... (minimum 50 characters)"
          required
        ></textarea>
        <div className="text-sm text-gray-500">
          {applicationData.coverMessage.length}/50 minimum characters
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={validateAndSubmit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>Submit Application</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ApplicationDetailsStep;
