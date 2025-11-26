import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const FreelancerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Load user data from auth context or API
    const fetchProfileData = async () => {
      try {
        if (user) {
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
              setProfileData(result.data);
            } else {
              console.error('Failed to fetch profile:', result.error);
              // Fallback to user context data
              setProfileData({
                name: user.name || 'N/A',
                email: user.email || 'N/A',
                phone: user.phone || 'N/A',
                location: user.location || 'N/A',
                role: user.role || 'Freelancer',
                picture: user.picture || '/assets/user_image.jpg',
                aboutMe: user.aboutMe || '',
                skills: user.skills || [],
                experience: user.experience || [],
                education: user.education || [],
                portfolio: user.portfolio || [],
                resume: user.resume || '',
                rating: user.rating || 0
              });
            }
          } else {
            // Fallback to user context data
            setProfileData({
              name: user.name || 'N/A',
              email: user.email || 'N/A',
              phone: user.phone || 'N/A',
              location: user.location || 'N/A',
              role: user.role || 'Freelancer',
              picture: user.picture || '/assets/user_image.jpg',
              aboutMe: user.aboutMe || '',
              skills: user.skills || [],
              experience: user.experience || [],
              education: user.education || [],
              portfolio: user.portfolio || [],
              resume: user.resume || '',
              rating: user.rating || 0
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to user context data
        if (user) {
          setProfileData({
            name: user.name || 'N/A',
            email: user.email || 'N/A',
            phone: user.phone || 'N/A',
            location: user.location || 'N/A',
            role: user.role || 'Freelancer',
            picture: user.picture || '/assets/user_image.jpg',
            aboutMe: user.aboutMe || '',
            skills: user.skills || [],
            experience: user.experience || [],
            education: user.education || [],
            portfolio: user.portfolio || [],
            resume: user.resume || '',
            rating: user.rating || 0
          });
        }
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, refreshKey]);

  // Listen for storage events to refresh when profile is updated
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'profileUpdated') {
        setRefreshKey(prev => prev + 1);
        localStorage.removeItem('profileUpdated');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check on mount if there's a pending update
    if (localStorage.getItem('profileUpdated')) {
      setRefreshKey(prev => prev + 1);
      localStorage.removeItem('profileUpdated');
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  if (!profileData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">No profile data available.</p>
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
          <h1 className="text-3xl font-bold text-navy-900">Freelancer Profile</h1>
          <button 
            onClick={() => navigate('/freelancer/profile/edit')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Profile
          </button>
        </div>

        {/* Profile Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-blue-500 bg-gray-900">
                <img 
                  src={profileData.picture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/assets/user_image.jpg';
                  }}
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-gray-900">{profileData.name}</h2>
                <span className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-semibold rounded-full flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="7"></circle>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                  </svg>
                  Top Freelancer
                </span>
              </div>

              <div className="text-lg text-gray-600 mb-4">{profileData.role}</div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 text-gray-600">
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
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{profileData.location}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
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
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>{profileData.email}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>{profileData.phone}</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 text-amber-500 text-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>★</span>
                ))}
                <span className="text-gray-700 font-semibold ml-2">{profileData.rating}/5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-6">
          {/* About Me Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">About Me</h3>
            <div className="text-gray-600 leading-relaxed">
              {profileData.aboutMe || 'No description provided.'}
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profileData.skills && profileData.skills.length > 0 ? (
                profileData.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No skills added yet.</p>
              )}
            </div>
          </div>

          {/* Experience Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">Experience</h3>
            <div className="space-y-4">
              {profileData.experience && profileData.experience.length > 0 ? (
                profileData.experience.map((exp, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                    <h5 className="font-semibold text-gray-900 text-lg">{exp.title || 'N/A'}</h5>
                    <p className="text-sm text-gray-500 mb-2">{exp.date || 'N/A'}</p>
                    <p className="text-gray-600">{exp.description || 'No description provided.'}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No experience added yet.</p>
              )}
            </div>
          </div>

          {/* Education Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">Education</h3>
            <div className="space-y-4">
              {profileData.education && profileData.education.length > 0 ? (
                profileData.education.map((edu, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                    <h5 className="font-semibold text-gray-900 text-lg">{edu.degree || 'N/A'}</h5>
                    <p className="text-sm text-gray-600 mb-1">{edu.institution || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{edu.date || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No education added yet.</p>
              )}
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">Portfolio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profileData.portfolio && profileData.portfolio.length > 0 ? (
                profileData.portfolio.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <img 
                      src={item.image || '/assets/portfolio/default.png'} 
                      alt={item.title || 'Portfolio Item'}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/portfolio/default.png';
                      }}
                    />
                    <div className="p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">{item.title || 'N/A'}</h5>
                      <p className="text-gray-600 text-sm mb-3">{item.description || 'No description provided.'}</p>
                      <a 
                        href={item.link || '#'} 
                        className="text-blue-500 hover:text-blue-600 font-medium text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Project →
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No portfolio items added yet.</p>
              )}
            </div>
          </div>

          {/* Resume Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">Resume</h3>
            {profileData.resume ? (
              <a 
                href={profileData.resume} 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                View Resume
              </a>
            ) : (
              <p className="text-gray-500">No resume uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FreelancerProfile;

