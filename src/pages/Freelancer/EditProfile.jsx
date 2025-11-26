import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    title: 'Freelancer',
    location: '',
    profileImageUrl: '',
    email: '',
    phone: '',
    about: '',
    resumeLink: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioFiles, setPortfolioFiles] = useState({}); // Store file objects by index
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Fetch profile data from backend
        const response = await fetch('http://localhost:9000/api/freelancer/profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const data = result.data;
            setFormData({
              name: data.name || '',
              // Title for freelancers is fixed
              title: 'Freelancer',
              location: data.location || '',
              profileImageUrl: data.picture || '',
              email: data.email || '',
              phone: data.phone || '',
              about: data.aboutMe || '',
              resumeLink: data.resume || ''
            });
            setSkills(data.skills || []);
            setExperience(data.experience || []);
            setEducation(data.education || []);
            setPortfolio(data.portfolio || []);
          }
        } else if (user) {
          // Fallback to user context
          setFormData({
            name: user.name || '',
            title: 'Freelancer',
            location: user.location || '',
            profileImageUrl: user.picture || '',
            email: user.email || '',
            phone: user.phone || '',
            about: user.aboutMe || '',
            resumeLink: user.resume || ''
          });
          setSkills(user.skills || []);
          setExperience(user.experience || []);
          setEducation(user.education || []);
          setPortfolio(user.portfolio || []);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to user context
          if (user) {
          setFormData({
            name: user.name || '',
            title: 'Freelancer',
            location: user.location || '',
            profileImageUrl: user.picture || '',
            email: user.email || '',
            phone: user.phone || '',
            about: user.aboutMe || '',
            resumeLink: user.resume || ''
          });
          setSkills(user.skills || []);
          setExperience(user.experience || []);
          setEducation(user.education || []);
          setPortfolio(user.portfolio || []);
        }
      }
    };

    fetchProfileData();
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Real-time phone validation
  useEffect(() => {
    const phone = formData.phone ? String(formData.phone).trim() : '';
    if (!phone) {
      setPhoneError('');
      return;
    }

    // Accept digits, spaces, dashes, parentheses and leading +, length 7-20
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Enter a valid phone number (digits, +, spaces, -).');
    } else {
      setPhoneError('');
    }
  }, [formData.phone]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddSkill = () => {
    const trimmedSkill = currentSkill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
      setCurrentSkill('');
    }
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSkillChange = (index, value) => {
    const updated = [...skills];
    updated[index] = value;
    setSkills(updated);
  };

  const handleAddExperience = () => {
    setExperience([...experience, { title: '', date: '', description: '' }]);
  };

  const handleRemoveExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const handleExperienceChange = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const handleAddEducation = () => {
    setEducation([...education, { degree: '', institution: '', date: '' }]);
  };

  const handleRemoveEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const handleAddPortfolio = () => {
    setPortfolio([...portfolio, { image: '', title: '', description: '', link: '' }]);
  };

  const handleRemovePortfolio = (index) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const handlePortfolioChange = (index, field, value) => {
    const updated = [...portfolio];
    updated[index][field] = value;
    setPortfolio(updated);
  };

  const handlePortfolioImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Store file for upload
      setPortfolioFiles(prev => ({
        ...prev,
        [index]: file
      }));
      
      // Create preview URL
      const updated = [...portfolio];
      updated[index].image = URL.createObjectURL(file);
      updated[index].isNewImage = true; // Mark as new image to upload
      setPortfolio(updated);
    }
  };

  const uploadPortfolioImages = async () => {
    const uploadedUrls = {};
    
    for (const [index, file] of Object.entries(portfolioFiles)) {
      const formDataImg = new FormData();
      formDataImg.append('portfolioImage', file);
      
      try {
        const response = await fetch('http://localhost:9000/api/freelancer/portfolio/image/upload', {
          method: 'POST',
          credentials: 'include',
          body: formDataImg
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          uploadedUrls[index] = result.data.imageUrl;
        } else {
          throw new Error(result.error || 'Failed to upload image');
        }
      } catch (error) {
        console.error('Error uploading portfolio image:', error);
        throw error;
      }
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First upload profile picture if selected
      if (profileImage) {
        const formDataImg = new FormData();
        formDataImg.append('profilePicture', profileImage);

        const response = await fetch('http://localhost:9000/api/freelancer/profile/picture/upload', {
          method: 'POST',
          credentials: 'include',
          body: formDataImg
        });

        const result = await response.json();

        if (response.ok && result.success) {
          formData.profileImageUrl = result.data.picture;
          setProfileImage(null);
          setProfileImagePreview('');
        } else {
          alert(result.error || 'Failed to upload profile picture');
          setLoading(false);
          return;
        }
      }

      // Upload portfolio images if any
      let updatedPortfolio = [...portfolio];
      if (Object.keys(portfolioFiles).length > 0) {
        try {
          const uploadedUrls = await uploadPortfolioImages();
          
          // Replace local preview URLs with Cloudinary URLs
          updatedPortfolio = portfolio.map((item, index) => {
            if (uploadedUrls[index]) {
              return { ...item, image: uploadedUrls[index], isNewImage: false };
            }
            return item;
          });
          
          // Clear portfolio files after upload
          setPortfolioFiles({});
        } catch (error) {
          alert('Failed to upload portfolio images. Please try again.');
          setLoading(false);
          return;
        }
      }

      const data = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        profileImageUrl: formData.profileImageUrl,
        about: formData.about,
        resumeLink: formData.resumeLink,
        skills,
        experience,
        education,
        portfolio: updatedPortfolio
      };

      const response = await fetch('http://localhost:9000/api/freelancer/profile/update', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Trigger profile refresh (notify other components)
        try { localStorage.setItem('profileUpdated', Date.now().toString()); } catch (e) {}
        try { window.dispatchEvent(new Event('profileUpdated')); } catch (e) {}
        alert('Profile updated successfully!');
        navigate('/freelancer/profile');
      } else {
        alert(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-navy-900">Edit Freelancer Profile</h1>
          <button 
            onClick={() => navigate('/freelancer/profile')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Profile
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-6">Profile Picture</h3>
            
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Current/Preview Image */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 bg-gray-100">
                  <img 
                    src={profileImagePreview || formData.profileImageUrl || '/assets/user_image.jpg'} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/assets/user_image.jpg';
                    }}
                  />
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Profile Picture
                </label>
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500">
                    Recommended: Square image, max 5MB. Supported formats: JPG, PNG, GIF. Will be uploaded when you click Save Changes.
                  </p>
                  {/* {formData.profileImageUrl && (
                    <p className="text-xs text-green-600">
                      ✓ Current image URL: {formData.profileImageUrl.substring(0, 50)}...
                    </p>
                  )} */}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-6">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || 'Freelancer'}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed text-gray-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-6">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed text-gray-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${phoneError ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'}`}
                />
                {phoneError && (
                  <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                )}
              </div>
            </div>
          </div>

          {/* About Me */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-6">About Me</h3>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleChange}
              rows="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-6">Skills</h3>
            
            {/* Skill Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Skills (Press Enter, comma, or semicolon to add)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Type skill and press Enter (e.g., React.js)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Skills Display */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full font-medium text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:bg-blue-600 rounded-full p-1 transition-colors"
                      aria-label="Remove skill"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {skills.length === 0 && (
              <p className="text-gray-500 text-center py-4">No skills added yet. Type a skill above and press Enter to add.</p>
            )}
          </div>

          {/* Experience */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-600">Experience</h3>
              <button
                type="button"
                onClick={handleAddExperience}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Experience
              </button>
            </div>
            
            <div className="space-y-4">
              {experience.map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                      placeholder="Job Title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      value={exp.date}
                      onChange={(e) => handleExperienceChange(index, 'date', e.target.value)}
                      placeholder="Date (e.g., Jan 2020 - Dec 2022)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <textarea
                      value={exp.description}
                      onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              ))}
              {experience.length === 0 && (
                <p className="text-gray-500 text-center py-4">No experience added. Click "Add Experience" to add one.</p>
              )}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-600">Education</h3>
              <button
                type="button"
                onClick={handleAddEducation}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Education
              </button>
            </div>
            
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                      placeholder="Degree"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                      placeholder="Institution"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      value={edu.date}
                      onChange={(e) => handleEducationChange(index, 'date', e.target.value)}
                      placeholder="Date (e.g., 2018 - 2022)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              ))}
              {education.length === 0 && (
                <p className="text-gray-500 text-center py-4">No education added. Click "Add Education" to add one.</p>
              )}
            </div>
          </div>

          {/* Portfolio */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-600">Portfolio</h3>
              <button
                type="button"
                onClick={handleAddPortfolio}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Portfolio Item
              </button>
            </div>
            
            <div className="space-y-4">
              {portfolio.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => handleRemovePortfolio(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-3">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Portfolio Image
                      </label>
                      {item.image && (
                        <div className="mb-2">
                          <img 
                            src={item.image} 
                            alt="Portfolio preview" 
                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                            onError={(e) => {
                              e.target.src = '/assets/portfolio_placeholder.jpg';
                            }}
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePortfolioImageChange(index, e)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max 5MB. Will be uploaded when you click Save Changes.
                      </p>
                    </div>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handlePortfolioChange(index, 'title', e.target.value)}
                      placeholder="Project Title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <textarea
                      value={item.description}
                      onChange={(e) => handlePortfolioChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="url"
                      value={item.link}
                      onChange={(e) => handlePortfolioChange(index, 'link', e.target.value)}
                      placeholder="Project Link (Optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              ))}
              {portfolio.length === 0 && (
                <p className="text-gray-500 text-center py-4">No portfolio items added. Click "Add Portfolio Item" to add one.</p>
              )}
            </div>
          </div>

          {/* Resume */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-6">Resume</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resume Link</label>
              <input
                type="url"
                name="resumeLink"
                value={formData.resumeLink}
                onChange={handleChange}
                placeholder="https://example.com/resume.pdf"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-sm text-gray-500 mt-2">Enter a direct link to your resume</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/freelancer/profile')}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!phoneError}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditProfile;
