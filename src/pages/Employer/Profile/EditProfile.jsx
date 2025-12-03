import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import DashboardLayout from '../../../components/DashboardLayout';

const EditEmployerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [aboutError, setAboutError] = useState('');
  const [nameError, setNameError] = useState('');
  const [companyNameError, setCompanyNameError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    companyName: '',
    websiteLink: '',
    aboutMe: '',
    picture: '',
    socialMedia: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: ''
    }
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (user) {
          const response = await fetch('http://localhost:9000/api/employer/profile', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setFormData({
                name: result.data.name || '',
                email: result.data.email || '',
                phone: result.data.phone || '',
                location: result.data.location || '',
                companyName: result.employer?.companyName || '',
                websiteLink: result.employer?.websiteLink || '',
                aboutMe: result.data.aboutMe || '',
                picture: result.data.picture || '',
                socialMedia: {
                  linkedin: result.data.socialMedia?.linkedin || '',
                  twitter: result.data.socialMedia?.twitter || '',
                  facebook: result.data.socialMedia?.facebook || '',
                  instagram: result.data.socialMedia?.instagram || ''
                }
              });
              setImagePreview(result.data.picture || '');
            } else {
              // Fallback to user context
              setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                location: user.location || '',
                companyName: user.companyName || '',
                websiteLink: user.websiteLink || '',
                aboutMe: user.aboutMe || '',
                picture: user.picture || '',
                socialMedia: user.socialMedia || {
                  linkedin: '',
                  twitter: '',
                  facebook: '',
                  instagram: ''
                }
              });
              setImagePreview(user.picture || '');
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (user) {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            location: user.location || '',
            companyName: user.companyName || '',
            websiteLink: user.websiteLink || '',
            aboutMe: user.aboutMe || '',
            picture: user.picture || '',
            socialMedia: user.socialMedia || {
              linkedin: '',
              twitter: '',
              facebook: '',
              instagram: ''
            }
          });
          setImagePreview(user.picture || '');
        }
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Real-time phone validation - +91 with 10 digits
  useEffect(() => {
    const phone = formData.phone ? String(formData.phone).trim() : '';
    if (!phone) {
      setPhoneError('');
      return;
    }

    // Remove all spaces and special characters except +
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    
    // Check if it starts with +91 and has exactly 10 digits after
    if (cleanPhone.startsWith('+91')) {
      const digitsAfter91 = cleanPhone.slice(3);
      if (!/^\d{10}$/.test(digitsAfter91)) {
        setPhoneError(`Phone must be +91 followed by exactly 10 digits (currently ${digitsAfter91.length} digits)`);
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('Phone number must start with +91 followed by 10 digits');
    }
  }, [formData.phone]);

  // Real-time about me validation - minimum 50 characters
  useEffect(() => {
    const about = formData.aboutMe ? String(formData.aboutMe).trim() : '';
    if (!about) {
      setAboutError('');
      return;
    }

    if (about.length < 50) {
      setAboutError(`Company description must be at least 50 characters (${about.length}/50)`);
    } else {
      setAboutError('');
    }
  }, [formData.aboutMe]);

  // Real-time contact name validation - minimum 3 characters
  useEffect(() => {
    const name = formData.name ? String(formData.name).trim() : '';
    if (!name) {
      setNameError('Contact name is required');
      return;
    }

    if (name.length < 3) {
      setNameError(`Contact name must be at least 3 characters (${name.length}/3)`);
    } else {
      setNameError('');
    }
  }, [formData.name]);

  // Real-time company name validation - minimum 3 characters
  useEffect(() => {
    const companyName = formData.companyName ? String(formData.companyName).trim() : '';
    if (!companyName) {
      setCompanyNameError('Company name is required');
      return;
    }

    if (companyName.length < 3) {
      setCompanyNameError(`Company name must be at least 3 characters (${companyName.length}/3)`);
    } else {
      setCompanyNameError('');
    }
  }, [formData.companyName]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('socialMedia.')) {
      const socialField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    const formDataImg = new FormData();
    formDataImg.append('picture', file);

    try {
      const response = await fetch('http://localhost:9000/api/employer/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formDataImg,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFormData(prev => ({
            ...prev,
            picture: result.imageUrl
          }));
          alert('Image uploaded successfully!');
        } else {
          alert('Failed to upload image. Please try again.');
        }
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('http://localhost:9000/api/employer/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Trigger profile refresh
          localStorage.setItem('profileUpdated', 'true');
          window.dispatchEvent(new Event('storage'));
          
          alert('Profile updated successfully!');
          navigate('/employer/profile');
        } else {
          alert(result.error || 'Failed to update profile. Please try again.');
        }
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          
          <button 
            onClick={() => navigate('/employer/profile')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profile Image Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Company Logo</h3>
            <div className="flex items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 bg-gray-100">
                  <img 
                    src={imagePreview || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Choose company logo</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer"
                  />
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  PNG, JPG up to 5MB. Recommended: 400x400px
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name * (min 3 characters)
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    nameError ? 'border-2 border-red-500' : 'border border-gray-300 focus:border-transparent'
                  }`}
                  placeholder="Enter contact name"
                />
                {nameError && (
                  <p className="text-sm text-red-600 mt-1">{nameError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name * (min 3 characters)
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    companyNameError ? 'border-2 border-red-500' : 'border border-gray-300 focus:border-transparent'
                  }`}
                  placeholder="Enter company name"
                />
                {companyNameError && (
                  <p className="text-sm text-red-600 mt-1">{companyNameError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email * (Cannot be changed)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed text-gray-700"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (+91 with 10 digits)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    phoneError ? 'border-2 border-red-500' : 'border border-gray-300 focus:border-transparent'
                  }`}
                  placeholder="+91 1234567890"
                />
                {phoneError && (
                  <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="websiteLink"
                  value={formData.websiteLink}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">About Company</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Description * (min 50 characters)
              </label>
              <textarea
                name="aboutMe"
                value={formData.aboutMe}
                onChange={handleInputChange}
                required
                rows={6}
                className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                  aboutError ? 'border-2 border-red-500' : 'border border-gray-300 focus:border-transparent'
                }`}
                placeholder="Tell us about your company, mission, values, and what makes you unique... (minimum 50 characters)"
              />
              <div className="flex justify-between items-center mt-2">
                <p className={`text-sm ${aboutError ? 'text-red-600' : 'text-gray-500'}`}>
                  {formData.aboutMe.length} characters {formData.aboutMe.length < 50 ? `(${50 - formData.aboutMe.length} more needed)` : '✓'}
                </p>
                {aboutError && (
                  <p className="text-sm text-red-600">{aboutError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Social Media</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </span>
                </label>
                <input
                  type="url"
                  name="socialMedia.linkedin"
                  value={formData.socialMedia.linkedin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                    </svg>
                    Twitter / X
                  </span>
                </label>
                <input
                  type="url"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://twitter.com/yourcompany"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </span>
                </label>
                <input
                  type="url"
                  name="socialMedia.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://facebook.com/yourcompany"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex gap-2">
                        
                        <svg className="w-5 h-5 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span className="text-gray-700">Instagram</span>
                    </span>
                </label>
                <input
                  type="url"
                  name="socialMedia.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://instagram.com/yourcompany"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            
            <button
              type="submit"
              disabled={saving || !!phoneError || !!aboutError || !!nameError || !!companyNameError || !formData.name || !formData.companyName || !formData.aboutMe}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditEmployerProfile;
