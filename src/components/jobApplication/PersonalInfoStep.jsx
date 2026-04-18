import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const PersonalInfoStep = ({ profileData, onUpdate, onNext }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeLastUpdated, setResumeLastUpdated] = useState('');

  // Formik setup for email validation
  const formik = useFormik({
    initialValues: {
      contactEmail: '',
    },
    validationSchema: Yup.object({
      contactEmail: Yup.string()
        .email('Invalid email format')
        .nullable(),
    }),
    validateOnChange: true,
    validateOnBlur: true,
  });

  // Extract filename from resume URL
  useEffect(() => {
    if (profileData.resume) {
      try {
        const url = new URL(profileData.resume);
        const pathParts = url.pathname.split('/');
        const filename = pathParts[pathParts.length - 1];
        // Decode URL encoded filename
        const decodedFilename = decodeURIComponent(filename);
        setResumeFileName(decodedFilename.replace(/\.[^/.]+$/, '') || 'Your Resume');
        
        // Set current date as last updated
        const now = new Date();
        setResumeLastUpdated(now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }));
      } catch (e) {
        setResumeFileName('Your Resume');
      }
    }
  }, [profileData.resume]);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${getBackendBaseUrl()}/api/freelancer/resume/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload resume');
      }

      if (result.success) {
        onUpdate({ resume: result.data.resume });
        setSuccess('Resume uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    if (!profileData.resume) {
      setError('Please upload your resume before proceeding');
      return;
    }

    // Validate form
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      formik.setTouched({ contactEmail: true });
      return;
    }
    
    // Pass contactEmail to parent
    onUpdate({ contactEmail: formik.values.contactEmail || profileData.email });
    onNext();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
      
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Profile Info Card */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-start space-x-4 mb-6">
          <div className="flex-shrink-0">
            {profileData.picture ? (
              <img 
                src={profileData.picture} 
                alt={profileData.name} 
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{profileData.name}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                {profileData.email}
              </p>
              <p className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {profileData.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Contact Email */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Primary Email to Contact
            <span className="text-gray-500 font-normal ml-2">(Optional - leave blank to use your account email)</span>
          </label>
          <input
            type="email"
            name="contactEmail"
            value={formik.values.contactEmail}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={profileData.email}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
              formik.touched.contactEmail && formik.errors.contactEmail
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                : formik.touched.contactEmail && !formik.errors.contactEmail && formik.values.contactEmail
                ? 'border-green-500 focus:ring-green-500 focus:border-green-500 bg-green-50'
                : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
            }`}
          />
          {formik.touched.contactEmail && formik.errors.contactEmail ? (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{formik.errors.contactEmail}</span>
            </p>
          ) : formik.touched.contactEmail && !formik.errors.contactEmail && formik.values.contactEmail ? (
            <p className="text-sm text-green-600 flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Valid email format</span>
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              If you'd like to be contacted at a different email address for this application, enter it here.
            </p>
          )}
        </div>
      </div>

      {/* Resume Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resume</h3>
        
        {profileData.resume ? (
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                  <path d="M14 2v6h6" />
                  <path d="M10 12h4" />
                  <path d="M10 15h4" />
                  <path d="M10 18h2" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">{resumeFileName || 'Your Resume'}</p>
                <p className="text-sm text-gray-500">
                  PDF Document{resumeLastUpdated ? ` • Last updated ${resumeLastUpdated}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const resumeUrl = profileData.resume.startsWith('/uploads') 
                    ? `${getBackendBaseUrl()}${profileData.resume}` 
                    : profileData.resume;
                  window.open(resumeUrl, '_blank');
                }}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                View
              </button>
              <label className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium cursor-pointer">
                Change
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">Upload your resume (PDF only, max 10MB)</p>
            <label className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer">
              {uploading ? 'Uploading...' : 'Choose File'}
              <input
                type="file"
                accept="application/pdf"
                onChange={handleResumeUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors flex items-center space-x-2"
        >
          <span>Continue to Application Details</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
