import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import DashboardPage from '../../../components/DashboardPage';
import PublicFeedbackSection from '../../../components/PublicFeedbackSection';

const EmployerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [employerData, setEmployerData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (user) {
          // Fetch profile data from backend
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
              setProfileData(result.data);
              setEmployerData(result.employer);
            } else {
              // Fallback to user context data
              setProfileData({
                name: user.name || 'N/A',
                email: user.email || 'N/A',
                phone: user.phone || 'N/A',
                location: user.location || 'N/A',
                role: user.role || 'Employer',
                picture: user.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png',
                aboutMe: user.aboutMe || '',
                socialMedia: user.socialMedia || {},
                rating: user.rating || 4.2,
                subscription: user.subscription || 'Basic'
              });
              setEmployerData({
                companyName: user.companyName || 'Company Name',
                websiteLink: user.websiteLink || ''
              });
            }
          } else {
            // Fallback to user context data
            setProfileData({
              name: user.name || 'N/A',
              email: user.email || 'N/A',
              phone: user.phone || 'N/A',
              location: user.location || 'N/A',
              role: user.role || 'Employer',
              picture: user.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png',
              aboutMe: user.aboutMe || '',
              socialMedia: user.socialMedia || {},
              rating: user.rating || 4.2,
              subscription: user.subscription || 'Basic'
            });
            setEmployerData({
              companyName: user.companyName || 'Company Name',
              websiteLink: user.websiteLink || ''
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (user) {
          setProfileData({
            name: user.name || 'N/A',
            email: user.email || 'N/A',
            phone: user.phone || 'N/A',
            location: user.location || 'N/A',
            role: user.role || 'Employer',
            picture: user.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png',
            aboutMe: user.aboutMe || '',
            socialMedia: user.socialMedia || {},
            rating: user.rating || 4.2,
            subscription: user.subscription || 'Basic'
          });
          setEmployerData({
            companyName: user.companyName || 'Company Name',
            websiteLink: user.websiteLink || ''
          });
        }
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, refreshKey]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('http://localhost:9000/api/employer/dashboard/stats', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setDashboardStats(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    if (user) {
      fetchDashboardStats();
    }
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
    
    if (localStorage.getItem('profileUpdated')) {
      setRefreshKey(prev => prev + 1);
      localStorage.removeItem('profileUpdated');
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return (
      <DashboardPage title="Profile">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  if (!profileData) {
    return (
      <DashboardPage title="Profile">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600">No profile data available.</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="Profile">
      {/* Header with description and action button */}
      <div className="flex justify-between items-center mb-6 -mt-4">
        <p className="text-gray-600">Manage your company profile and information</p>
        <button 
          onClick={() => navigate('/employer/profile/edit')}
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

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-4xl font-bold text-blue-600">
              {dashboardStats !== null ? dashboardStats.activeJobs : <span className="animate-pulse">0</span>}
            </div>
            <div className="text-sm text-gray-600 mt-2 font-medium">ACTIVE JOBS</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-4xl font-bold text-blue-600">
              {dashboardStats !== null ? dashboardStats.currentFreelancers : <span className="animate-pulse">0</span>}
            </div>
            <div className="text-sm text-gray-600 mt-2 font-medium">ACTIVE FREELANCERS</div>
          </div>
        </div>

        {/* Profile Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-blue-500 bg-gray-900">
                <img 
                  src={profileData.picture} 
                  alt="Company Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';
                  }}
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-gray-900">
                  {profileData.name}
                </h2>
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
                  Top Employer
                </span>
              </div>

              <div className="text-lg text-gray-600 mb-4">{employerData?.companyName}</div>

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
                  <span>{profileData.location || 'Not specified'}</span>
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
                  <span>{profileData.phone || 'Not specified'}</span>
                </div>

                {employerData?.websiteLink && (
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
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <a 
                      href={employerData.websiteLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      {employerData.websiteLink}
                    </a>
                  </div>
                )}
              </div>

              {/* Social Links
              {profileData.socialMedia && Object.values(profileData.socialMedia).some(link => link) && (
                <div className="flex gap-3 mb-5">
                  {profileData.socialMedia.linkedin && (
                    <a 
                      href={profileData.socialMedia.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  )}
                  {profileData.socialMedia.twitter && (
                    <a 
                      href={profileData.socialMedia.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                      </svg>
                    </a>
                  )}
                  {profileData.socialMedia.facebook && (
                    <a 
                      href={profileData.socialMedia.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {profileData.socialMedia.instagram && (
                    <a 
                      href={profileData.socialMedia.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )} */}

              {/* Rating */}
              <div className="flex items-center gap-2 text-amber-500 text-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>
                    {star <= Math.floor(profileData.rating) ? '★' : star === Math.ceil(profileData.rating) && profileData.rating % 1 !== 0 ? '☆' : '☆'}
                  </span>
                ))}
                <span className="text-gray-700 font-semibold ml-2">{profileData.rating}/5</span>
                {/* <span className="text-gray-500 text-sm">(54 reviews)</span> */}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* About Section - Takes 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">
                About {employerData?.companyName}
              </h3>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                {profileData.aboutMe || 'No description provided.'}
              </div>
            </div>
          </div>

          {/* Subscription Section - Takes 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5.5">
              {/* <h3 className="text-2xl font-bold text-blue-600 mb-4">Subscription</h3> */}
              <div className="flex items-center gap-3">
                <span className="text-gray-600">Current Plan:</span>
                <span className={`px-4 py-2 rounded-full font-semibold text-sm ${
                  profileData.subscription === 'Premium' 
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {profileData.subscription || 'Basic'}
                </span>
              </div>
              {profileData.subscription !== 'Premium' && (
                <button 
                  onClick={() => navigate('/employer/subscription')}
                  className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Public Feedback Section */}
        <PublicFeedbackSection userId={user?.id} />

        {/* Social Media & Links Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-6">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">Social Media & Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {profileData.socialMedia?.linkedin ? (
                <a
                  href={profileData.socialMedia.linkedin}
                  className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn Profile
                </a>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 text-gray-400 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span className="text-sm">No LinkedIn</span>
                </div>
              )}

            {profileData.socialMedia?.twitter ? (
                <a
                  href={profileData.socialMedia.twitter}
                  className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                  Twitter Handle
                </a>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 text-gray-400 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                  <span className="text-sm">No Twitter</span>
                </div>
              )}

            {profileData.socialMedia?.facebook ? (
                <a
                  href={profileData.socialMedia.facebook}
                  className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                  Facebook Page
                </a>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 text-gray-400 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                  <span className="text-sm">No Facebook</span>
                </div>
              )}

            {profileData.socialMedia?.instagram ? (
                <a
                  href={profileData.socialMedia.instagram}
                  className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.40z"/>
                  </svg>
                  Instagram Account
                </a>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 text-gray-400 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.40z"/>
                  </svg>
                  <span className="text-sm">No Instagram</span>
                </div>
              )}
            </div>
          </div>
        </div>
    </DashboardPage>
  );
};

export default EmployerProfile;
