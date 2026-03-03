import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import {
  fetchUnreadCount,
  selectUnreadCount,
} from '../redux/slices/notificationsSlice';
import { useChatNotifications } from '../context/ChatNotificationContext';

// Paths that unapproved employers can access (must match ProtectedRoute)
const UNAPPROVED_EMPLOYER_ALLOWED_PATHS = [
  '/',
  '/employer/profile',
  '/employer/profile/edit',
  '/employer/company-details',
];

const DashboardLayout = ({ children }) => {
  const { user, logout, checkAuthStatus } = useAuth();
  const { totalUnreadCount } = useChatNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isPremium, setIsPremium] = useState(false);
  
  const unreadCount = useSelector(selectUnreadCount);

  // Check if employer is unapproved
  const isUnapprovedEmployer = user?.role === 'Employer' && user?.isApproved === false;

  // Helper to check if a path is allowed for unapproved employers
  const isPathAllowedForUnapproved = (path) => {
    return UNAPPROVED_EMPLOYER_ALLOWED_PATHS.some(
      (allowedPath) => path === allowedPath || path.startsWith(allowedPath + '/')
    );
  };

  useEffect(() => {
    // Update premium status whenever user changes
    setIsPremium(user?.subscription === 'Premium');
  }, [user]);

  // Fetch unread notification count
  useEffect(() => {
    if (user && (user.role === 'Employer' || user.role === 'Freelancer')) {
      dispatch(fetchUnreadCount());
      
      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        dispatch(fetchUnreadCount());
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [dispatch, user]);

  // Listen for profile updates from other pages (EditProfile)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'profileUpdated') {
        // Refresh auth/user data so sidebar reflects latest profile picture/name
        if (typeof checkAuthStatus === 'function') {
          checkAuthStatus();
        }
        try {
          // remove the flag
          localStorage.removeItem('profileUpdated');
        } catch (err) {
          // ignore
        }
      }
    };

    const onCustom = () => {
      if (typeof checkAuthStatus === 'function') checkAuthStatus();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('profileUpdated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('profileUpdated', onCustom);
    };
  }, [checkAuthStatus]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case 'Admin':
        return [
          { name: 'Home', path: '/', icon: 'fas fa-home' },
          { name: 'Dashboard', path: '/admin/dashboard', icon: 'fas fa-tachometer-alt' },
          { name: 'Platform', path: '/admin/platform', icon: 'fas fa-layer-group' },
          { name: 'Payments', path: '/admin/payments', icon: 'fas fa-credit-card' },
          { name: 'Moderators', path: '/admin/moderators', icon: 'fas fa-user-shield' },
          { name: 'Freelancers', path: '/admin/freelancers', icon: 'fas fa-user-tie' },
          { name: 'Employers', path: '/admin/employers', icon: 'fas fa-building' },
          { name: 'Users', path: '/admin/users', icon: 'fas fa-users' },
          { name: 'Chat', path: '/admin/chat', icon: 'fas fa-comments' },
          { name: 'Profile', path: '/admin/profile', icon: 'fas fa-user' },
        ];
      case 'Moderator':
        return [
          { name: 'Home', path: '/', icon: 'fas fa-home' },
          { name: 'Job Listings', path: '/moderator/job-listings', icon: 'fas fa-briefcase' },
          { name: 'Freelancers', path: '/moderator/freelancers', icon: 'fas fa-users' },
          { name: 'Employers', path: '/moderator/employers', icon: 'fas fa-building' },
          { name: 'Approvals', path: '/moderator/approvals', icon: 'fas fa-check-circle' },
          { name: 'Complaints', path: '/moderator/complaints', icon: 'fas fa-exclamation-triangle' },
          { name: 'Quizzes', path: '/moderator/quizzes', icon: 'fas fa-question-circle' },
          { name: 'Blogs', path: '/moderator/blogs', icon: 'fas fa-blog' },
          { name: 'Chat', path: '/moderator/chat', icon: 'fas fa-comments' },
          { name: 'Profile', path: '/moderator/profile', icon: 'fas fa-user' },
        ];
      case 'Employer':
        return [
          { name: 'Home', path: '/', icon: 'fas fa-home' },
          { name: 'Profile', path: '/employer/profile', icon: 'fas fa-user' },
          { name: 'Notifications', path: '/employer/notifications', icon: 'fas fa-bell', showBadge: true },
          { name: 'Job Listings', path: '/employer/job-listings', icon: 'fas fa-briefcase' },
          { name: 'Current Jobs', path: '/employer/current-jobs', icon: 'fas fa-tasks' },
          { name: 'Applications', path: '/employer/applications', icon: 'fas fa-file-alt' },
          { name: 'Work History', path: '/employer/work-history', icon: 'fas fa-history' },
          { name: 'Chat', path: '/employer/chat', icon: 'fas fa-comments' },
          { name: 'Subscription', path: '/employer/subscription', icon: 'fas fa-crown' },
          { name: 'Transactions', path: '/employer/transactions', icon: 'fas fa-credit-card' },
        ];
      case 'Freelancer':
        return [
          { name: 'Home', path: '/', icon: 'fas fa-home' },
          { name: 'Profile', path: '/freelancer/profile', icon: 'fas fa-user' },
          { name: 'Notifications', path: '/freelancer/notifications', icon: 'fas fa-bell', showBadge: true },
          { name: 'My Jobs', path: '/freelancer/active-jobs', icon: 'fas fa-briefcase' },
          { name: 'Job History', path: '/freelancer/job-history', icon: 'fas fa-history' },
          { name: 'Payments', path: '/freelancer/payments', icon: 'fas fa-credit-card' },
          { name: 'Skills & Badges', path: '/freelancer/skills-badges', icon: 'fas fa-award' },
          { name: 'Chat', path: '/freelancer/chat', icon: 'fas fa-comments' },
          { name: 'Subscription', path: '/freelancer/subscription', icon: 'fas fa-crown' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getRoleDisplay = () => {
    if (!user) return '';
    return user.role;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 text-white flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-blue-600/30">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {/* {isPremium && (
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg">
                  <i className="fas fa-star text-white text-sm"></i>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-900 animate-pulse"></div>
              </div>
            )} */}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-blue-500">
                <img 
                  src={user?.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<i class="fas fa-user text-blue-600 text-xl"></i>';
                  }}
                />
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">Welcome, {getRoleDisplay()} {user?.name ? user.name.split(' ')[0] : 'User'}!</h2>
              {isPremium && (
                <p className="text-xs text-yellow-300 font-medium mt-0.5">Premium Member</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const showChatBadge = item.name === 'Chat' && totalUnreadCount > 0;
            const showNotificationBadge = item.showBadge && unreadCount > 0;
            const isLocked = isUnapprovedEmployer && !isPathAllowedForUnapproved(item.path);
            
            // For locked items, render a div instead of Link
            if (isLocked) {
              return (
                <div
                  key={item.path}
                  className="flex items-center gap-3 px-6 py-3 text-base font-medium transition-all relative text-white/40 cursor-not-allowed blur-[1px]"
                  title="Your account is pending approval"
                >
                  <i className={`${item.icon} text-lg w-5`}></i>
                  <span>{item.name}</span>
                  <i className="fas fa-lock absolute right-4 text-yellow-400/70 text-sm"></i>
                </div>
              );
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 text-base font-medium transition-all relative ${
                  isActive
                    ? 'bg-white/20 border-l-4 border-white text-white'
                    : 'text-white/90 hover:bg-white/10 border-l-4 border-transparent hover:border-white/50'
                }`}
              >
                <i className={`${item.icon} text-lg w-5`}></i>
                <span>{item.name}</span>
                {showNotificationBadge && (
                  <span className="absolute right-4 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {showChatBadge && (
                  <span className="absolute right-4 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </Link>
            );
          })}
          
          {/* Pending Approval Notice for unapproved employers */}
          {/* {isUnapprovedEmployer && (
            <div className="mx-1 mt-1 p-3 bg-yellow-500/20 border border-yellow-400/40 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-300 text-sm">
                <i className="fas fa-clock"></i>
                <span className="font-medium">Pending Approval</span>
              </div>
              <p className="text-yellow-200/80 text-xs mt-1">
                Your account is being reviewed. You'll get full access once approved.
              </p>
            </div>
          )} */}
        </nav>

        {/* Logout Button */}
        <div className="p-2 border-t border-blue-600/30">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-base transition-all border border-white/20 hover:border-white/40"
          >
            <i className="fas fa-sign-out-alt text-lg"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

