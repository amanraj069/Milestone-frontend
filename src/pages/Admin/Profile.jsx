import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardPage from '../../components/DashboardPage';
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const API_BASE = getBackendBaseUrl();

const AdminProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const getDefaultProfileData = (user) => ({
    name: user.name || 'N/A',
    email: user.email || 'N/A',
    phone: user.phone || 'N/A',
    location: user.location || 'N/A',
    role: user.role || 'Admin',
    picture: user.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png',
    aboutMe: user.aboutMe || '',
    socialMedia: user.socialMedia || {},
    subscription: 'Platform Admin',
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, overviewRes, activitiesRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/profile`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/dashboard/overview`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/dashboard/activities`, { credentials: 'include' }),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfileData(data.success ? data.data : (user ? getDefaultProfileData(user) : null));
        } else if (user) {
          setProfileData(getDefaultProfileData(user));
        }

        if (overviewRes.ok) {
          const data = await overviewRes.json();
          if (data.success) setDashboardStats(data.data);
        }

        if (activitiesRes.ok) {
          const data = await activitiesRes.json();
          if (data.success) setRecentActivities(data.data);
        }
      } catch (error) {
        if (user) setProfileData(getDefaultProfileData(user));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user, refreshKey]);

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

  const headerAction = (
    <Link
      to="/admin/profile/edit"
      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
    >
      Edit Profile
    </Link>
  );

  if (loading) {
    return (
      <DashboardPage title="Admin Profile" headerAction={headerAction}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </DashboardPage>
    );
  }

  if (!profileData) {
    return (
      <DashboardPage title="Admin Profile" headerAction={headerAction}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No profile data</p>
          <p className="text-gray-500">Unable to load profile information.</p>
        </div>
      </DashboardPage>
    );
  }

  const socialLinks = [
    { key: 'linkedin', label: 'LinkedIn', url: profileData?.socialMedia?.linkedin },
    { key: 'twitter', label: 'Twitter', url: profileData?.socialMedia?.twitter },
    { key: 'facebook', label: 'Facebook', url: profileData?.socialMedia?.facebook },
    { key: 'instagram', label: 'Instagram', url: profileData?.socialMedia?.instagram },
  ];

  return (
    <DashboardPage title="Admin Profile" headerAction={headerAction}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Users</p>
          <p className="text-2xl font-semibold text-gray-900">
            {dashboardStats?.users?.total ?? <span className="text-gray-300">--</span>}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Active Jobs</p>
          <p className="text-2xl font-semibold text-gray-900">
            {dashboardStats?.jobs?.active ?? <span className="text-gray-300">--</span>}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Moderators</p>
          <p className="text-2xl font-semibold text-gray-900">
            {dashboardStats?.users?.moderators ?? <span className="text-gray-300">--</span>}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Premium Users</p>
          <p className="text-2xl font-semibold text-gray-900">
            {dashboardStats?.users?.premium ?? <span className="text-gray-300">--</span>}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col justify-between min-h-[240px]">
            <div className="flex flex-col items-center mb-6">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-blue-100 mb-2">
                <img
                  src={profileData?.picture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{profileData?.name}</h2>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mb-2">
                {profileData?.role}
              </span>
              <span className="text-sm text-gray-500">Platform Admin</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-400 w-16 flex-shrink-0">Email</span>
                <span className="text-gray-700 font-medium truncate">{profileData?.email}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-400 w-16 flex-shrink-0">Phone</span>
                <span className="text-gray-700 font-medium">{profileData?.phone || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-400 w-16 flex-shrink-0">Location</span>
                <span className="text-gray-700 font-medium">{profileData?.location || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Me */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">About Me</h3>
            </div>
            <div className="p-6">
              {profileData?.aboutMe ? (
                <p className="text-gray-600 leading-relaxed">{profileData.aboutMe}</p>
              ) : (
                <p className="text-gray-400 italic">No bio added yet.</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              {recentActivities && recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map((activity, index) => {
                    const iconMap = {
                      user: 'fas fa-user-plus text-blue-500',
                      complaint: 'fas fa-gavel text-orange-500',
                      job: 'fas fa-briefcase text-purple-500',
                      application: 'fas fa-file-alt text-green-500',
                    };
                    return (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <i className={iconMap[activity.icon] || 'fas fa-info-circle text-gray-400'}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No recent activities</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Social Media</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {socialLinks.map(({ key, label, url }) => (
              url ? (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  {label}
                </a>
              ) : (
                <div
                  key={key}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-50 text-gray-400 rounded-lg text-sm border-2 border-dashed border-gray-200"
                >
                  No {label}
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </DashboardPage>
  );
};

export default AdminProfile;
