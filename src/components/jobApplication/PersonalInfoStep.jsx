import React, { useState, useEffect } from 'react';

const PersonalInfoStep = ({ profileData, onUpdate, onNext }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    email: profileData.email,
    phone: profileData.phone,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeLastUpdated, setResumeLastUpdated] = useState('');

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

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedData({
        email: profileData.email,
        phone: profileData.phone,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData({
      ...editedData,
      [name]: value,
    });
  };

  const handleSaveProfile = async () => {
    try {
      setError('');
      setSuccess('');

      const response = await fetch('http://localhost:9000/api/freelancer/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      if (result.success) {
        onUpdate(result.data);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    }
  };

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

      const response = await fetch('http://localhost:9000/api/freelancer/resume/upload', {
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

  const handleNext = () => {
    if (!profileData.resume) {
      setError('Please upload your resume before proceeding');
      return;
    }
    onNext();
  };

  return (
    <div className="personal-info-step">
      <h2 className="step-title">Personal Information</h2>
      
      {/* Success Message */}
      {success && (
        <div className="success-alert">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-alert">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Profile Info Card */}
      <div className="profile-info-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profileData.picture ? (
              <img src={profileData.picture} alt={profileData.name} />
            ) : (
              <div className="avatar-placeholder">
                <i className="fas fa-user"></i>
              </div>
            )}
          </div>
          <div className="profile-header-info">
            <h3>{profileData.name}</h3>
            {!isEditing && (
              <button
                type="button"
                className="btn-edit-small"
                onClick={handleEditToggle}
              >
                <i className="fas fa-edit"></i> Edit personal details
              </button>
            )}
          </div>
        </div>

        <div className="profile-fields">
          <div className="form-group">
            <label>Email</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={editedData.email}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            ) : (
              <div className="field-value">{profileData.email}</div>
            )}
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={editedData.phone}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            ) : (
              <div className="field-value">{profileData.phone}</div>
            )}
          </div>

          {isEditing && (
            <div className="edit-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleEditToggle}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveProfile}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resume Section */}
      <div className="resume-section">
        <h3 className="section-title">Resume</h3>
        
        {profileData.resume ? (
          <div className="resume-card">
            <div className="resume-info">
              <div className="resume-icon">
                <i className="fas fa-file-pdf"></i>
              </div>
              <div className="resume-details">
                <p className="resume-name">{resumeFileName || 'Your Resume'}</p>
                <p className="resume-meta">
                  PDF Document{resumeLastUpdated ? ` • Last updated ${resumeLastUpdated}` : ''}
                </p>
              </div>
            </div>
            <div className="resume-actions">
              <button
                type="button"
                className="btn-icon"
                onClick={() => {
                  const resumeUrl = profileData.resume.startsWith('/uploads') 
                    ? `http://localhost:9000${profileData.resume}` 
                    : profileData.resume;
                  window.open(resumeUrl, '_blank');
                }}
                title="View Resume"
              >
                <i className="fas fa-eye"></i> View
              </button>
              <label className="btn-icon" title="Change Resume">
                <i className="fas fa-upload"></i> Change
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="resume-upload-card">
            <div className="upload-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <p className="upload-text">Upload your resume (PDF only, max 10MB)</p>
            <label className="btn-primary">
              {uploading ? 'Uploading...' : 'Choose File'}
              <input
                type="file"
                accept="application/pdf"
                onChange={handleResumeUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="step-actions">
        <button
          type="button"
          className="btn-primary btn-large"
          onClick={handleNext}
        >
          Continue to Application Details
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
