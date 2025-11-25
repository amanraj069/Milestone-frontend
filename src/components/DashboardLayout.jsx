import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Update premium status whenever user changes
    setIsPremium(user?.subscription === 'Premium');
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case 'Admin':
        return [
          { name: 'Home', path: '/', icon: 'fas fa-home' },
          { name: 'Job Listings', path: '/admin/job-listings', icon: 'fas fa-briefcase' },
          { name: 'Freelancers', path: '/admin/freelancers', icon: 'fas fa-users' },
          { name: 'Employers', path: '/admin/employers', icon: 'fas fa-building' },
          { name: 'Complaints', path: '/admin/complaints', icon: 'fas fa-exclamation-triangle' },
          { name: 'Quizzes', path: '/admin/quizzes', icon: 'fas fa-question-circle' },
          { name: 'Blogs', path: '/admin/blogs', icon: 'fas fa-blog' },
          { name: 'Profile', path: '/admin/profile', icon: 'fas fa-user' },
        ];
      case 'Employer':
        return [
          { name: 'Home', path: '/', icon: 'fas fa-home' },
          { name: 'Profile', path: '/employer/profile', icon: 'fas fa-user' },
          { name: 'Job Listings', path: '/employer/job-listings', icon: 'fas fa-briefcase' },
          { name: 'Current Jobs', path: '/employer/current-jobs', icon: 'fas fa-tasks' },
          { name: 'Applications', path: '/employer/applications', icon: 'fas fa-file-alt' },
          { name: 'Work History', path: '/employer/work-history', icon: 'fas fa-history' },
          { name: 'Subscription', path: '/employer/subscription', icon: 'fas fa-crown' },
          { name: 'Transactions', path: '/employer/transactions', icon: 'fas fa-credit-card' },
        ];
      case 'Freelancer':
        return [
          { name: 'Home', path: '/', icon: 'fas fa-home' },
          { name: 'Profile', path: '/freelancer/profile', icon: 'fas fa-user' },
          { name: 'Active Jobs', path: '/freelancer/active-jobs', icon: 'fas fa-briefcase' },
          { name: 'Job History', path: '/freelancer/job-history', icon: 'fas fa-history' },
          { name: 'Payments', path: '/freelancer/payments', icon: 'fas fa-credit-card' },
          { name: 'Skills & Badges', path: '/freelancer/skills-badges', icon: 'fas fa-award' },
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
            {isPremium && (
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg">
                  <i className="fas fa-star text-white text-sm"></i>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-900 animate-pulse"></div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border-3 border-blue-500">
              <img 
                src="/assets/profile.png" 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<i class="fas fa-user text-blue-600 text-xl"></i>';
                }}
              />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">Welcome, {getRoleDisplay()} {user?.name ? user.name.split(' ')[0] : 'User'}!</h2>
              {isPremium && (
                <p className="text-xs text-yellow-300 font-medium mt-0.5">Premium Member ⭐</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 text-base font-medium transition-all ${
                  isActive
                    ? 'bg-white/20 border-l-4 border-white text-white'
                    : 'text-white/90 hover:bg-white/10 border-l-4 border-transparent hover:border-white/50'
                }`}
              >
                <i className={`${item.icon} text-lg w-5`}></i>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-6 border-t border-blue-600/30">
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

