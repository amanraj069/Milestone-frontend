import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user, getDashboardRoute } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Same as Home page */}
      <header className="bg-white/95 border-gray-200 backdrop-blur-md border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className="text-4xl font-bold text-gray-900">
              <Link to="/" className="hover:text-navy-700 transition-colors">
                Mile<span className="text-navy-700">stone</span>
              </Link>
            </div>
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for services..." 
                  className="w-full px-5 py-3 border-2 rounded-full text-sm outline-none transition-all focus:border-navy-700 focus:ring-4 focus:ring-navy-100 border-gray-200"
                  disabled
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-navy-700 text-white border-none rounded-full w-9 h-9 cursor-pointer transition-all hover:bg-navy-800 flex items-center justify-center shrink-0">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link 
                  to={getDashboardRoute()} 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-lg font-medium no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <i className="fas fa-tachometer-alt"></i>
                  Dashboard
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-lg font-medium no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 404 Content */}
      <div className="pt-28 pb-20 bg-gradient-to-br from-navy-50 via-white to-gray-50 flex items-center justify-center px-4 min-h-[calc(100vh-20px)]">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Large Text */}
          <div className="flex items-center justify-center">
            <h1 className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-navy-700 to-navy-900 leading-none">
              4
            </h1>
            <div className="mx-2 md:mx-4">
              <Search className="w-24 h-24 md:w-32 md:h-32 text-navy-700 animate-pulse" strokeWidth={2.5} />
            </div>
            <h1 className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-navy-700 to-navy-900 leading-none">
              4
            </h1>
          </div>

          {/* Message */}
          <div className="mt-8 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
            
            <Link
              to="/"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl no-underline hover:-translate-y-0.5"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">You might be looking for:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/jobs"
                className="px-4 py-2 text-sm text-navy-700 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors no-underline"
              >
                Browse Jobs
              </Link>
              <Link
                to="/blogs"
                className="px-4 py-2 text-sm text-navy-700 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors no-underline"
              >
                Read Blogs
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-navy-700 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors no-underline"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm text-navy-700 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors no-underline"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Same as Home page */}
      <footer className="bg-gray-950 text-white pt-20 pb-8" id="footer">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <h3 className="text-3xl font-bold mb-6">Mile<span className="text-navy-400">stone</span></h3>
              <p className="text-gray-400 mb-6 leading-relaxed">India's leading freelancing platform connecting businesses with skilled professionals across the nation.</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-gray-800/50 rounded-xl flex items-center justify-center text-gray-400 transition-all duration-300 hover:bg-navy-600 hover:text-white hover:-translate-y-1">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800/50 rounded-xl flex items-center justify-center text-gray-400 transition-all duration-300 hover:bg-navy-600 hover:text-white hover:-translate-y-1">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800/50 rounded-xl flex items-center justify-center text-gray-400 transition-all duration-300 hover:bg-navy-600 hover:text-white hover:-translate-y-1">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800/50 rounded-xl flex items-center justify-center text-gray-400 transition-all duration-300 hover:bg-navy-600 hover:text-white hover:-translate-y-1">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white text-lg">For Clients</h4>
              <ul className="list-none space-y-3">
                <li><Link to="/how-it-works" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">How it Works</Link></li>
                <li><Link to="/talent" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">Browse Talent</Link></li>
                <li><Link to="/post-job" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">Post a Job</Link></li>
                <li><Link to="/enterprise" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">Enterprise</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white text-lg">For Freelancers</h4>
              <ul className="list-none space-y-3">
                <li><Link to="/jobs" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">Find Jobs</Link></li>
                <li><Link to="/resources" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">Resources</Link></li>
                <li><Link to="/community" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">Community</Link></li>
                <li><Link to="/success-stories" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">Success Stories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white text-lg">Company</h4>
              <ul className="list-none space-y-3">
                <li><Link to="/about" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">About Us</Link></li>
                <li><Link to="/careers" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">Careers</Link></li>
                <li><Link to="/press" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">Press</Link></li>
                <li><Link to="/contact" className="text-gray-400 no-underline transition-all duration-300 hover:text-white hover:pl-1">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800/50 text-gray-500">
            <p className="text-sm">© 2024 Milestone. All rights reserved.</p>
            <div className="flex gap-8 mt-4 md:mt-0">
              <Link to="/privacy" className="text-sm text-gray-500 no-underline transition-colors hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-gray-500 no-underline transition-colors hover:text-white">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
