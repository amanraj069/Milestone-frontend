// EditProfile.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';
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
  const [aboutError, setAboutError] = useState('');
  const [nameError, setNameError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [skillError, setSkillError] = useState('');
  const [experienceErrors, setExperienceErrors] = useState({});
  const [educationErrors, setEducationErrors] = useState({});
  const [portfolioErrors, setPortfolioErrors] = useState({});
  const [resumeError, setResumeError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [currentSkillError, setCurrentSkillError] = useState('');
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
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/freelancer/profile`, {
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

  // Cleanup blob URLs ONLY on unmount to prevent memory leaks
  useEffect(() => {
    const currentProfilePreview = profileImagePreview;
    const currentPortfolio = [...portfolio];
    
    return () => {
      // Only cleanup on unmount
      if (currentProfilePreview && currentProfilePreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentProfilePreview);
      }
      currentPortfolio.forEach(item => {
        if (item.image && item.image.startsWith('blob:')) {
          URL.revokeObjectURL(item.image);
        }
      });
    };
  }, []); // Empty dependency array - only run on mount/unmount

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Show a top-level form error banner when user attempts to submit invalid form
  const [showFormErrors, setShowFormErrors] = useState(false);

  // Reset form error banner when all errors are cleared
  useEffect(() => {
    const hasErrors = !!phoneError || !!aboutError || !!nameError || !!locationError || !!skillError || !!resumeError ||
                      Object.keys(experienceErrors).length > 0 || Object.keys(educationErrors).length > 0 || Object.keys(portfolioErrors).length > 0;
    if (!hasErrors) {
      setShowFormErrors(false);
    }
  }, [phoneError, aboutError, nameError, locationError, skillError, resumeError, experienceErrors, educationErrors, portfolioErrors]);

  const validateAll = () => {
    let valid = true;

    // Name
    if (!formData.name || String(formData.name).trim().length < 2) {
      setNameError('Name is required and must be at least 2 characters');
      valid = false;
    }

    // Skills
    if (!skills || skills.length === 0) {
      setSkillError('Add at least one skill to showcase your expertise');
      valid = false;
    }

    // About
    if (!formData.about || String(formData.about).trim().length < 50) {
      setAboutError('About me must be at least 50 characters');
      valid = false;
    }

    // Phone (re-run validation)
    const phone = formData.phone ? String(formData.phone).trim() : '';
    if (phone) {
      const cleanPhone = phone.replace(/[\s\-()]/g, '');
      if (!cleanPhone.startsWith('+91')) {
        setPhoneError('Phone number must start with +91 followed by 10 digits');
        valid = false;
      } else {
        const digitsAfter91 = cleanPhone.slice(3);
        if (!/^\d{10}$/.test(digitsAfter91)) {
          setPhoneError(`Phone must be +91 followed by exactly 10 digits (currently ${digitsAfter91.length} digits)`);
          valid = false;
        }
      }
    }

    // Existing reactive error objects
    if (Object.keys(experienceErrors).length > 0) valid = false;
    if (Object.keys(educationErrors).length > 0) valid = false;
    if (Object.keys(portfolioErrors).length > 0) valid = false;
    if (!resumeFile && resumeError) valid = false; // Only check resumeError if no new file selected

    if (!valid) {
      setShowFormErrors(true);
      // scroll to first visible error (element with red border)
      setTimeout(() => {
        const formEl = document.getElementById('edit-profile-form');
        if (formEl) {
          const firstErr = formEl.querySelector('.border-red-500, .text-red-600');
          if (firstErr && typeof firstErr.scrollIntoView === 'function') {
            firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Try focusing an input inside that element
            const input = firstErr.querySelector('input, textarea, button');
            if (input && typeof input.focus === 'function') input.focus();
          }
        }
      }, 60);
    } else {
      setShowFormErrors(false);
    }

    return valid;
  };

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

  // Real-time about me validation
  useEffect(() => {
    const about = formData.about ? String(formData.about).trim() : '';
    if (!about) {
      setAboutError('');
      return;
    }

    if (about.length < 50) {
      setAboutError(`About me must be at least 50 characters (${about.length}/50)`);
    } else {
      setAboutError('');
    }
  }, [formData.about]);

  // Real-time name validation
  useEffect(() => {
    const name = formData.name ? String(formData.name).trim() : '';
    if (!name) {
      setNameError('Name is required');
      return;
    }

    if (name.length < 2) {
      setNameError('Name must be at least 2 characters');
    } else if (name.length > 100) {
      setNameError('Name must be less than 100 characters');
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      setNameError('Name can only contain letters, spaces, hyphens, and apostrophes');
    } else {
      setNameError('');
    }
  }, [formData.name]);

  // Real-time location validation
  useEffect(() => {
    const location = formData.location ? String(formData.location).trim() : '';
    if (!location) {
      setLocationError('');
      return;
    }

    if (location.length < 2) {
      setLocationError('Location must be at least 2 characters');
    } else if (location.length > 100) {
      setLocationError('Location must be less than 100 characters');
    } else {
      setLocationError('');
    }
  }, [formData.location]);

  // Real-time skill validation
  useEffect(() => {
    if (skills.length === 0) {
      setSkillError('Add at least one skill to showcase your expertise');
    } else {
      setSkillError('');
    }
  }, [skills]);

  // Real-time experience validation
  useEffect(() => {
    const errors = {};
    experience.forEach((exp, index) => {
      const expErrors = {};
      if (exp.title && exp.title.trim().length < 2) {
        expErrors.title = 'Job title must be at least 2 characters';
      }
      if (exp.title && exp.title.trim().length > 100) {
        expErrors.title = 'Job title must be less than 100 characters';
      }
      if (exp.date && exp.date.trim().length < 4) {
        expErrors.date = 'Date must be at least 4 characters (e.g., 2020)';
      }
      if (exp.date && exp.date.trim().length > 50) {
        expErrors.date = 'Date must be less than 50 characters';
      }
      if (exp.description && exp.description.trim().length < 20) {
        expErrors.description = `Description must be at least 20 characters (${exp.description.trim().length}/20)`;
      }
      if (exp.description && exp.description.trim().length > 500) {
        expErrors.description = 'Description must be less than 500 characters';
      }
      if (Object.keys(expErrors).length > 0) {
        errors[index] = expErrors;
      }
    });
    setExperienceErrors(errors);
  }, [experience]);

  // Real-time education validation
  useEffect(() => {
    const errors = {};
    education.forEach((edu, index) => {
      const eduErrors = {};
      if (edu.degree && edu.degree.trim().length < 2) {
        eduErrors.degree = 'Degree must be at least 2 characters';
      }
      if (edu.degree && edu.degree.trim().length > 100) {
        eduErrors.degree = 'Degree must be less than 100 characters';
      }
      if (edu.institution && edu.institution.trim().length < 2) {
        eduErrors.institution = 'Institution must be at least 2 characters';
      }
      if (edu.institution && edu.institution.trim().length > 100) {
        eduErrors.institution = 'Institution must be less than 100 characters';
      }
      if (edu.date && edu.date.trim().length < 4) {
        eduErrors.date = 'Date must be at least 4 characters (e.g., 2020)';
      }
      if (edu.date && edu.date.trim().length > 50) {
        eduErrors.date = 'Date must be less than 50 characters';
      }
      if (Object.keys(eduErrors).length > 0) {
        errors[index] = eduErrors;
      }
    });
    setEducationErrors(errors);
  }, [education]);

  // Real-time portfolio validation
  useEffect(() => {
    const errors = {};
    portfolio.forEach((item, index) => {
      const itemErrors = {};
      if (item.title && item.title.trim().length < 3) {
        itemErrors.title = 'Title must be at least 3 characters';
      }
      if (item.description && item.description.trim().length < 20) {
        itemErrors.description = `Description must be at least 20 characters (${item.description.trim().length}/20)`;
      }
      if (item.link && item.link.trim() && !item.link.match(/^https?:\/\/.+/)) {
        itemErrors.link = 'Link must be a valid URL (start with http:// or https://)';
      }
      if (Object.keys(itemErrors).length > 0) {
        errors[index] = itemErrors;
      }
    });
    setPortfolioErrors(errors);
  }, [portfolio]);

  // Real-time resume link validation
  useEffect(() => {
    if (resumeFile) {
      // If a new resume file is selected, skip validation for the old link
      setResumeError('');
      return;
    }
    const resume = formData.resumeLink ? String(formData.resumeLink).trim() : '';
    if (!resume) {
      setResumeError('');
      return;
    }

    
    setResumeError('');
  }, [formData.resumeLink, resumeFile]);

  // Real-time current skill validation
  useEffect(() => {
    const skill = currentSkill.trim();
    if (!skill) {
      setCurrentSkillError('');
      return;
    }

    if (skill.length < 2) {
      setCurrentSkillError('Skill must be at least 2 characters');
    } else if (skill.length > 50) {
      setCurrentSkillError('Skill must be less than 50 characters');
    } else if (skills.includes(skill)) {
      setCurrentSkillError('This skill is already added');
    } else if (!/^[a-zA-Z0-9\s.+#-]+$/.test(skill)) {
      setCurrentSkillError('Skill can only contain letters, numbers, spaces, and . + # -');
    } else {
      setCurrentSkillError('');
    }
  }, [currentSkill, skills]);

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
      const blobUrl = URL.createObjectURL(file);
      console.log('Created profile image blob URL:', blobUrl);
      setProfileImage(file);
      setProfileImagePreview(blobUrl);
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
      const blobUrl = URL.createObjectURL(file);
      console.log('Created portfolio blob URL for index', index, ':', blobUrl);
      const updated = [...portfolio];
      updated[index].image = blobUrl;
      updated[index].isNewImage = true; // Mark as new image to upload
      setPortfolio(updated);
    }
  };

  const handleResumeFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Allow PDF only, max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Resume must be less than 10MB');
      return;
    }
    if (file.type !== 'application/pdf') {
      alert('Only PDF resumes are allowed');
      return;
    }
    setResumeFile(file);
    setResumeFileName(file.name);
  };

  const uploadPortfolioImages = async () => {
    const uploadedUrls = {};
    
    for (const [index, file] of Object.entries(portfolioFiles)) {
      const formDataImg = new FormData();
      formDataImg.append('portfolioImage', file);
      
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/freelancer/portfolio/image/upload`, {
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

  const uploadResumeFile = async () => {
    if (!resumeFile) return null;
    setResumeUploading(true);
    const formDataResume = new FormData();
    formDataResume.append('resume', resumeFile);

    try {
      const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/freelancer/resume/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formDataResume
      });
      const resJson = await resp.json();
      if (resp.ok && resJson.success) {
        // prefer common keys
        return resJson.data?.resumeUrl || resJson.data?.url || resJson.data?.resume || null;
      } else {
        throw new Error(resJson.error || 'Resume upload failed');
      }
    } catch (err) {
      console.error('Resume upload error', err);
      alert(err.message || 'Failed to upload resume');
      return null;
    } finally {
      setResumeUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Run full validation before uploading files
    const ok = validateAll();
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      // First upload profile picture if selected
      if (profileImage) {
        const formDataImg = new FormData();
        formDataImg.append('profilePicture', profileImage);

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/freelancer/profile/picture/upload`, {
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
          setProfileImage(null);
          setProfileImagePreview('');
          setLoading(false);
          return;
        }
      }

      // Upload resume file if user selected one
      if (resumeFile) {
        const resumeUrl = await uploadResumeFile();
        if (!resumeUrl) {
          setLoading(false);
          return;
        }
        // set the returned URL into formData for the profile update
        formData.resumeLink = resumeUrl;
        // reset selected resume file so it's not re-uploaded accidentally
        setResumeFile(null);
        setResumeFileName('');
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

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/freelancer/profile/update`, {
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
          {showFormErrors && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-2">
              <p className="text-sm text-red-700">Please fix the highlighted fields before saving.</p>
            </div>
          )}
          {/* Profile Picture Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
             <h3 className="text-xl font-bold text-gray-800 mb-4">Profile Picture</h3>
            
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Current/Preview Image */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 bg-gray-100">
                  <img 
                    src={profileImagePreview || formData.profileImageUrl || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('Profile image loaded:', profileImagePreview || formData.profileImageUrl)}
                    onError={(e) => {
                      console.error('Profile image failed to load:', e.target.src);
                      e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';
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
                      Current image URL: {formData.profileImageUrl.substring(0, 50)}...
                    </p>
                  )} */}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
             <h3 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${nameError ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'}`}
                />
                {nameError && (
                  <p className="text-sm text-red-600 mt-1">{nameError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Chennai, India"
                  className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${locationError ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'}`}
                />
                {locationError && (
                  <p className="text-sm text-red-600 mt-1">{locationError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
             <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
            
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone (+91 with 10 digits)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                  className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${phoneError ? 'border-2 border-red-500' : 'border border-gray-300 focus:border-blue-500'}`}
                />
                {phoneError && (
                  <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                )}
              </div>
            </div>
          </div>

          {/* About Me */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
             <h3 className="text-xl font-bold text-gray-800 mb-4">About Me</h3>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleChange}
              rows="6"
              className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${aboutError ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'}`}
              placeholder="Tell us about yourself... (minimum 50 characters)"
            />
            <div className="flex justify-between items-center mt-2">
              <p className={`text-sm ${aboutError ? 'text-red-600' : 'text-gray-500'}`}>
                {formData.about.length} characters {formData.about.length < 50 ? `(${50 - formData.about.length} more needed)` : ''}
              </p>
              {aboutError && (
                <p className="text-sm text-red-600">{aboutError}</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
             <h3 className="text-xl font-bold text-gray-800 mb-4">Skills *</h3>
            
            {/* Skill Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Skills (Press Enter, comma, or semicolon to add)
              </label>
              {skillError && skills.length === 0 && (
                <p className="text-sm text-red-600 mb-2">{skillError}</p>
              )}
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Type skill and press Enter (e.g., React.js)"
                    className={`flex-1 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      currentSkillError ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={!!currentSkillError || !currentSkill.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                {currentSkillError && (
                  <p className="text-sm text-red-600 mt-1">{currentSkillError}</p>
                )}
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
               <h3 className="text-xl font-bold text-gray-800 mb-4">Experience</h3>
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
                    <div>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                        placeholder="Job Title"
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          experienceErrors[index]?.title ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {experienceErrors[index]?.title && (
                        <p className="text-sm text-red-600 mt-1">{experienceErrors[index].title}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={exp.date}
                        onChange={(e) => handleExperienceChange(index, 'date', e.target.value)}
                        placeholder="Date (e.g., Jan 2020 - Dec 2022)"
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          experienceErrors[index]?.date ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {experienceErrors[index]?.date && (
                        <p className="text-sm text-red-600 mt-1">{experienceErrors[index].date}</p>
                      )}
                    </div>
                    <div>
                      <textarea
                        value={exp.description}
                        onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                        placeholder="Description (minimum 20 characters)"
                        rows="3"
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${
                          experienceErrors[index]?.description ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {experienceErrors[index]?.description && (
                        <p className="text-sm text-red-600 mt-1">{experienceErrors[index].description}</p>
                      )}
                    </div>
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
               <h3 className="text-xl font-bold text-gray-800 mb-4">Education</h3>
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
                    <div>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                        placeholder="Degree"
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          educationErrors[index]?.degree ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {educationErrors[index]?.degree && (
                        <p className="text-sm text-red-600 mt-1">{educationErrors[index].degree}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                        placeholder="Institution"
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          educationErrors[index]?.institution ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {educationErrors[index]?.institution && (
                        <p className="text-sm text-red-600 mt-1">{educationErrors[index].institution}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={edu.date}
                        onChange={(e) => handleEducationChange(index, 'date', e.target.value)}
                        placeholder="Date (e.g., 2018 - 2022)"
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          educationErrors[index]?.date ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {educationErrors[index]?.date && (
                        <p className="text-sm text-red-600 mt-1">{educationErrors[index].date}</p>
                      )}
                    </div>
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
               <h3 className="text-xl font-bold text-gray-800 mb-4">Portfolio</h3>
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
                      {item.image ? (
                        <div className="mb-2">
                          <img 
                            src={item.image} 
                            alt="Portfolio preview" 
                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                        </div>
                      ) : (
                        <div className="mb-2 w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <i className="fas fa-image text-gray-400 text-2xl"></i>
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
                    <div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handlePortfolioChange(index, 'title', e.target.value)}
                        placeholder="Project Title"
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          portfolioErrors[index]?.title ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {portfolioErrors[index]?.title && (
                        <p className="text-sm text-red-600 mt-1">{portfolioErrors[index].title}</p>
                      )}
                    </div>
                    <div>
  <textarea
    value={item.description || ''}
    onChange={(e) => handlePortfolioChange(index, 'description', e.target.value)}
    placeholder="Description (minimum 20 characters)"
    rows="3"
    className={`w-full px-4 py-2 rounded-lg resize-none transition-colors focus:ring-2 outline-none border ${
      item.description?.trim().length > 0 && item.description.trim().length < 20
        ? 'border-red-500 focus:ring-red-400'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }`}
  />

  {/* Live character counter + error message */}
  <div className="flex justify-between items-center mt-2">
    {/* Character counter */}
    <p className={`text-sm font-medium ${
      item.description?.trim().length > 0 && item.description.trim().length < 20
        ? 'text-red-600'
        : 'text-gray-500'
    }`}>
      {item.description?.length || 0} / 20 characters
      {item.description && item.description.trim().length < 20 && (
        <span> ({20 - item.description.trim().length} more needed)</span>
      )}
    </p>

    {/* Optional: keep your centralized error message if you want */}
    {portfolioErrors[index]?.description && (
      <p className="text-sm text-red-600">
        {portfolioErrors[index].description}
      </p>
    )}
  </div>
</div>
                    <div>
                      <input
                        type="url"
                        value={item.link}
                        onChange={(e) => handlePortfolioChange(index, 'link', e.target.value)}
                        placeholder="Project Link (Optional)"
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          portfolioErrors[index]?.link ? 'border border-red-500' : 'border border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {portfolioErrors[index]?.link && (
                        <p className="text-sm text-red-600 mt-1">{portfolioErrors[index].link}</p>
                      )}
                    </div>
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
             <h3 className="text-xl font-bold text-gray-800 mb-4">Resume</h3>
            <div>
              {formData.resumeLink ? (
                <div className="flex items-center gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      let fullUrl = formData.resumeLink;
                      if (formData.resumeLink.startsWith('/uploads')) {
                        fullUrl = `${API_BASE_URL}${formData.resumeLink}`;
                      }
                      window.open(fullUrl, '_blank');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View Resume
                  </button>
                  
                </div>
              ) : (
                <p className="text-gray-500 mb-4">No resume uploaded yet.</p>
              )}

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Resume (PDF, max 10MB)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {resumeFileName && (
                  <p className="text-sm text-gray-600 mt-2">Selected: {resumeFileName} {resumeUploading && '(Uploading...)'}</p>
                )}
                {resumeError ? (
                  <p className="text-sm text-red-600 mt-2">{resumeError}</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">You can upload a PDF resume and it will be saved when you click Save Changes.</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            
            <button
              type="submit"
              disabled={loading}
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
