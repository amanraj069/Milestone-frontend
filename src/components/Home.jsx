import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import BlogSection from './Home/BlogSection';

const Home = () => {
  const { user, getDashboardRoute } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [currentFreelancerIndex, setCurrentFreelancerIndex] = useState(0);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  const freelancers = [
    {
      name: 'Aman Raj',
      title: 'Full Stack Developer',
      avatar: '/assets/home/aman.png',
      rating: 4.9,
      reviews: 127,
      completed: 89,
      skills: ['React', 'Node.js', 'MongoDB'],
      featured: true
    },
    {
      name: 'Vanya Awasthi',
      title: 'UI/UX Designer',
      avatar: '/assets/home/vanya.png',
      rating: 4.8,
      reviews: 95,
      completed: 76,
      skills: ['Figma', 'Adobe XD', 'Prototyping'],
      topRated: true
    },
    {
      name: 'Deepak Kumar',
      title: 'Data Scientist',
      avatar: '/assets/home/deepak.jpg',
      rating: 4.9,
      reviews: 112,
      completed: 68,
      skills: ['Python', 'Machine Learning', 'Data Analysis']
    },
    {
      name: 'Jayanth Patel',
      title: 'Mobile Developer',
      avatar: '/assets/home/jayanth.png',
      rating: 4.7,
      reviews: 89,
      completed: 54,
      skills: ['React Native', 'Flutter', 'iOS']
    },
    {
      name: 'Abhishek Singh',
      title: 'DevOps Engineer',
      avatar: '/assets/home/abhishek.jpg',
      rating: 4.8,
      reviews: 103,
      completed: 72,
      skills: ['AWS', 'Docker', 'Kubernetes']
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'CEO, TechStart India',
      content: 'Milestone has been instrumental in helping us find top-tier freelancers. The quality of work and professionalism is outstanding.',
      avatar: '/assets/user_female.png',
      rating: 5
    },
    {
      name: 'Rahul Verma',
      role: 'Product Manager, Infosys',
      content: 'As a freelancer, Milestone has provided me with consistent, high-quality projects. The platform is intuitive and fair.',
      avatar: '/assets/user_image.jpg',
      rating: 5
    },
    {
      name: 'Ananya Gupta',
      role: 'Marketing Director, Flipkart',
      content: 'The project management tools and communication features make working with remote teams seamless and efficient.',
      avatar: '/assets/user_female.png',
      rating: 5
    }
  ];

  // Auto-rotate freelancers carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFreelancerIndex((prev) => (prev + 1) % freelancers.length);
    }, 3000); // Change every 3 seconds
    
    return () => clearInterval(interval);
  }, [freelancers.length]);

  // Auto-rotate testimonials carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Change every 4 seconds
    
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Fetch all jobs on mount
  useEffect(() => {
    loadJobs();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter jobs based on search term
  useEffect(() => {
    if (searchTerm.trim() && jobs.length > 0) {
      const search = searchTerm.toLowerCase();
      const filtered = jobs.filter(job =>
        job.title.toLowerCase().includes(search) ||
        job.description.skills.some(skill => skill.toLowerCase().includes(search)) ||
        job.category?.toLowerCase().includes(search)
      ).slice(0, 5); // Show max 5 results
      setSearchResults(filtered);
      setShowSearchDropdown(filtered.length > 0);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchTerm, jobs]);

  const loadJobs = async () => {
    try {
      const response = await fetch('http://localhost:9000/api/jobs/api', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to jobs page with search query
      navigate(`/jobs?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      // Navigate to jobs page without search
      navigate('/jobs');
    }
    setShowSearchDropdown(false);
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchInputFocus = () => {
    if (searchTerm.trim() && searchResults.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleResultClick = (jobId) => {
    setShowSearchDropdown(false);
    setSearchTerm('');
    navigate(`/jobs/${jobId}`);
  };

  const formatSalary = (budget) => {
    if (!budget) return 'Not specified';
    return `₹${budget.amount.toLocaleString()}${budget.type === 'fixed' ? '' : '/' + budget.type}`;
  };

  const getDaysAgo = (postedDate) => {
    const now = new Date();
    const posted = new Date(postedDate);
    const daysDiff = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return '1 Day Ago';
    return `${daysDiff} Days Ago`;
  };

  const isNewJob = (postedDate) => {
    const now = new Date();
    const posted = new Date(postedDate);
    const hoursDiff = (now - posted) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const nextFreelancer = () => {
    setCurrentFreelancerIndex((prev) => (prev + 1) % freelancers.length);
  };

  const prevFreelancer = () => {
    setCurrentFreelancerIndex((prev) => (prev - 1 + freelancers.length) % freelancers.length);
  };

  const nextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} backdrop-blur-md border-b fixed top-0 left-0 right-0 z-50`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Link to="/" className="hover:text-navy-700 transition-colors">
                Mile<span className="text-navy-700">stone</span>
              </Link>
            </div>
            <div className="flex-1 max-w-md mx-8 relative" ref={searchRef}>
              <form className="relative" onSubmit={handleSearch}>
                <input 
                  type="text" 
                  placeholder="Search for services..." 
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchInputFocus}
                  className={`w-full px-5 py-3 border-2 rounded-full text-sm outline-none transition-all focus:border-navy-700 focus:ring-4 focus:ring-navy-100 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`}
                />
                <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-navy-700 text-white border-none rounded-full w-9 h-9 cursor-pointer transition-all hover:bg-navy-800 flex items-center justify-center shrink-0">
                  <i className="fas fa-search"></i>
                </button>
              </form>
              
              {/* Search Results Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl border overflow-hidden z-50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`px-4 py-2 border-b text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'bg-gray-900 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    Job Suggestions ({searchResults.length})
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {searchResults.map((job) => (
                      <div
                        key={job.jobId}
                        onClick={() => handleResultClick(job.jobId)}
                        className={`px-4 py-3 cursor-pointer transition-all duration-200 border-b last:border-b-0 ${theme === 'dark' ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-100'}`}
                      >
                        <div className="flex gap-3 items-center">
                          {/* Company Logo/Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={job.imageUrl || '/assets/default-job.png'}
                              alt={job.title}
                              className={`w-12 h-12 rounded-full object-cover border-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%234f46e5" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle"%3E' + job.title.charAt(0) + '%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>

                          {/* Job Info */}
                          <div className="flex-1 min-w-0">
                            {/* Job Title and Badges */}
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {job.title}
                              </h4>
                              {isNewJob(job.postedDate) && (
                                <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded flex-shrink-0">
                                  New
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Salary */}
                              <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                ₹{job.budget.amount.toLocaleString()}
                                <span className={`text-xs font-normal ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  /{job.budget.period}
                                </span>
                              </span>

                              {/* Skills */}
                              {job.description.skills.slice(0, 3).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Right Side - Date and Applicants */}
                          <div className="flex flex-col items-end justify-center gap-1 flex-shrink-0">
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {getDaysAgo(job.postedDate)}
                            </span>
                            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {job.applicationCount || 0} applicants
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`px-4 py-2.5 text-center border-t ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <button
                      onClick={handleSearch}
                      className="text-sm font-medium text-navy-700 hover:text-navy-800 transition-colors"
                    >
                      View all results →
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className={`border-2 rounded-lg text-lg cursor-pointer transition-all p-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-navy-700'}`}
              >
                <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
              </button>
              
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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white pt-32 pb-24 px-4 sm:px-8 min-h-screen flex items-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/15 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-navy-600/20 to-navy-400/10 rounded-full blur-3xl"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20 shadow-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-white/90">10,000+ freelancers ready to work</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
                Elevate Your
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
                  Career With
                </span>
                Top Talent
              </h1>
              
              <p className="text-lg sm:text-xl mb-8 text-white/70 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Connect with skilled freelancers or find exciting projects that match your expertise.
              </p>
              
              <div className="flex gap-4 justify-center flex-wrap mb-10">
                <Link 
                  to="/jobs" 
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-navy-900 rounded-2xl font-semibold no-underline transition-all duration-300 hover:shadow-2xl hover:shadow-white/25 hover:-translate-y-1"
                >
                  <i className="fas fa-briefcase group-hover:rotate-12 transition-transform"></i>
                  Find Jobs
                  <i className="fas fa-arrow-right text-sm opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"></i>
                </Link>
                <Link 
                  to={user && user.role === 'Employer' ? "/employer/job-listings/new" : "/signup"}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-semibold no-underline transition-all duration-300 hover:bg-white hover:text-navy-900 hover:-translate-y-1 hover:shadow-xl"
                >
                  <i className="fas fa-plus group-hover:rotate-90 transition-transform"></i>
                  Post a Job
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="flex justify-center lg:justify-start items-center gap-4 sm:gap-8 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-green-400 text-xs"></i>
                  </div>
                  <span className="text-sm font-medium text-white/80">Verified Talent</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-shield-alt text-blue-400 text-xs"></i>
                  </div>
                  <span className="text-sm font-medium text-white/80">Secure Payments</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-headset text-purple-400 text-xs"></i>
                  </div>
                  <span className="text-sm font-medium text-white/80">24/7 Support</span>
                </div>
              </div>
            </div>
            
            {/* Right Content - Hero Image */}
            <div className="flex justify-center items-center relative order-1 lg:order-2 mb-8 lg:mb-0">
              <div className="relative w-full max-w-lg lg:max-w-2xl">
                {/* Glow effect behind image */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl scale-75"></div>
                
                {/* Main illustration */}
                <img 
                  src="/assets/home/Freelancer-bro.svg" 
                  alt="Freelancer working" 
                  className="relative w-full drop-shadow-2xl scale-110"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-24 ${theme === 'dark' ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ${theme === 'dark' ? 'bg-navy-800 text-navy-300' : 'bg-navy-100 text-navy-700'}`}>Our Impact</span>
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy-700 to-navy-500">achievement</span> at a glance
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className={`group p-8 md:p-10 rounded-2xl text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:border-navy-500' : 'bg-white border-gray-100 hover:border-navy-200'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-navy-700 to-navy-600' : 'bg-gradient-to-br from-navy-100 to-navy-50'}`}>
                <i className={`fas fa-users text-2xl ${theme === 'dark' ? 'text-navy-300' : 'text-navy-700'}`}></i>
              </div>
              <h3 className={`text-4xl md:text-5xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>10K+</h3>
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Active Freelancers</p>
            </div>
            <div className={`group p-8 md:p-10 rounded-2xl text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:border-navy-500' : 'bg-white border-gray-100 hover:border-navy-200'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-navy-700 to-navy-600' : 'bg-gradient-to-br from-navy-100 to-navy-50'}`}>
                <i className={`fas fa-briefcase text-2xl ${theme === 'dark' ? 'text-navy-300' : 'text-navy-700'}`}></i>
              </div>
              <h3 className={`text-4xl md:text-5xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>5K+</h3>
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Projects Completed</p>
            </div>
            <div className={`group p-8 md:p-10 rounded-2xl text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:border-navy-500' : 'bg-white border-gray-100 hover:border-navy-200'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-navy-700 to-navy-600' : 'bg-gradient-to-br from-navy-100 to-navy-50'}`}>
                <i className={`fas fa-globe text-2xl ${theme === 'dark' ? 'text-navy-300' : 'text-navy-700'}`}></i>
              </div>
              <h3 className={`text-4xl md:text-5xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>28+</h3>
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>States Covered</p>
            </div>
            <div className={`group p-8 md:p-10 rounded-2xl text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:border-navy-500' : 'bg-white border-gray-100 hover:border-navy-200'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-amber-700 to-amber-600' : 'bg-gradient-to-br from-amber-100 to-amber-50'}`}>
                <i className={`fas fa-star text-2xl ${theme === 'dark' ? 'text-amber-300' : 'text-amber-500'}`}></i>
              </div>
              <h3 className={`text-4xl md:text-5xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>4.9/5</h3>
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Header */}
      <section className={`py-16 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`} id="features">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-4xl mx-auto">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ${theme === 'dark' ? 'bg-navy-800 text-navy-300' : 'bg-navy-100 text-navy-700'}`}>Why Choose Us</span>
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy-700 to-navy-500">Succeed</span>
            </h2>
            <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Milestone provides all the tools you need to find, hire, and work with top freelancers from around the world.
            </p>
          </div>
        </div>
      </section>

      {/* Feature 1: Find Jobs */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                <i className="fas fa-briefcase mr-2"></i>For Freelancers
              </span>
              <h3 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Find Your Dream Projects</h3>
              <p className={`text-lg mb-6 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Browse thousands of job listings from top Indian companies and startups. Our smart matching algorithm helps you find projects that perfectly match your skills and experience.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <i className={`fas fa-check text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}></i>
                  </div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Access to 5000+ active job listings</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <i className={`fas fa-check text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}></i>
                  </div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>AI-powered job recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <i className={`fas fa-check text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}></i>
                  </div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Apply with one click using your profile</span>
                </li>
              </ul>
              <Link to="/jobs" className="inline-flex items-center gap-2 px-6 py-3 bg-navy-800 text-white rounded-xl font-semibold hover:bg-navy-900 transition-all hover:shadow-lg no-underline">
                Browse Jobs <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <img src="/assets/home/Online resume-cuate.svg" alt="Find Jobs" className="w-full max-w-md drop-shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Post Jobs */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img src="/assets/home/oversight-bro.svg" alt="Post Jobs" className="w-full max-w-md drop-shadow-xl" />
            </div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${theme === 'dark' ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                <i className="fas fa-building mr-2"></i>For Employers
              </span>
              <h3 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Hire Top Talent Easily</h3>
              <p className={`text-lg mb-6 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Post your job requirements and get matched with qualified freelancers instantly. Review portfolios, compare rates, and hire the perfect candidate for your project.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <i className={`fas fa-check text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}></i>
                  </div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Post unlimited job listings</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <i className={`fas fa-check text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}></i>
                  </div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Get applications within 24 hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <i className={`fas fa-check text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}></i>
                  </div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Verified freelancers with ratings & reviews</span>
                </li>
              </ul>
              <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-navy-800 text-white rounded-xl font-semibold hover:bg-navy-900 transition-all hover:shadow-lg no-underline">
                Post a Job <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Secure Payments */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${theme === 'dark' ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                <i className="fas fa-shield-alt mr-2"></i>Secure Platform
              </span>
              <h3 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Safe & Secure Payments</h3>
              <p className={`text-lg mb-6 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Our milestone-based payment system ensures that funds are released only when you're satisfied with the work. Enjoy peace of mind with our secure escrow protection.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <i className={`fas fa-check text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}></i>
                  </div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Escrow protection on all payments</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <i className={`fas fa-check text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}></i>
                  </div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Milestone-based payment releases</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <i className={`fas fa-check text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}></i>
                  </div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>UPI, Net Banking & Card payments supported</span>
                </li>
              </ul>
              <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-navy-800 text-white rounded-xl font-semibold hover:bg-navy-900 transition-all hover:shadow-lg no-underline">
                Get Started <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <img src="/assets/home/Mobile Marketing-bro.svg" alt="Secure Payments" className="w-full max-w-md drop-shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Features Grid */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <h3 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>More Powerful Features</h3>
            <p className={`max-w-xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Everything you need to succeed in your freelancing journey</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: 'fa-award', title: 'Skill Badges', desc: 'Take quizzes and earn badges to showcase your verified skills.', color: 'from-violet-500 to-purple-600' },
              { icon: 'fa-clock', title: 'Time Tracking', desc: 'Built-in time tracking tools for hourly projects.', color: 'from-blue-500 to-cyan-600' },
              { icon: 'fa-certificate', title: 'Verified Talent', desc: 'All freelancers undergo thorough vetting process.', color: 'from-amber-500 to-orange-600' },
              { icon: 'fa-comments', title: 'Real-time Chat', desc: 'Communicate instantly with your team members.', color: 'from-pink-500 to-rose-600' },
              { icon: 'fa-chart-line', title: 'Analytics Dashboard', desc: 'Track your progress and earnings in real-time.', color: 'from-emerald-500 to-teal-600' },
              { icon: 'fa-rocket', title: 'Fast Delivery', desc: 'Efficient workflow system for quick turnaround.', color: 'from-navy-600 to-navy-800' }
            ].map((feature, idx) => (
              <div key={idx} className={`group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-gray-500' : 'bg-gray-50 hover:bg-white border-transparent hover:border-gray-200'}`}>
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <i className={`fas ${feature.icon} text-lg text-white`}></i>
                </div>
                <h4 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h4>
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Freelancers Section */}
      <section className={`py-24 ${theme === 'dark' ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-gray-50 to-white'}`} id="freelancers">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-14">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ${theme === 'dark' ? 'bg-navy-800 text-navy-300' : 'bg-navy-100 text-navy-700'}`}>Top Talent</span>
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Meet Our Top Freelancers</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Work with the best talent in the industry</p>
          </div>
          
          {/* Auto-scrolling carousel */}
          <div className="relative overflow-hidden">
            <div 
              className="flex gap-6 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentFreelancerIndex * (100 / 3)}%)` }}
            >
              {/* Duplicate freelancers for infinite scroll effect */}
              {[...freelancers, ...freelancers].map((freelancer, idx) => (
                <div 
                  key={idx} 
                  className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 px-2"
                >
                  <div className={`rounded-3xl p-6 shadow-lg border transition-all duration-300 h-full ${theme === 'dark' ? 'bg-gray-800 shadow-gray-900/50 border-gray-700 hover:shadow-2xl hover:border-navy-500' : 'bg-white shadow-gray-200/50 border-gray-100 hover:shadow-2xl hover:border-navy-200'}`}>
                    {freelancer.featured && (
                      <div className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-4 shadow-lg shadow-emerald-500/30">
                        <i className="fas fa-star text-xs"></i> Featured
                      </div>
                    )}
                    {freelancer.topRated && (
                      <div className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-4 shadow-lg shadow-amber-500/30">
                        <i className="fas fa-crown text-xs"></i> Top Rated
                      </div>
                    )}
                    {!freelancer.featured && !freelancer.topRated && (
                      <div className="h-7 mb-4"></div>
                    )}
                    
                    <div className="flex items-center gap-4 mb-5">
                      <div className="relative">
                        <img src={freelancer.avatar} alt={freelancer.name} className={`w-16 h-16 rounded-2xl object-cover border-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-100'}`} />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 ${theme === 'dark' ? 'border-gray-800' : 'border-white'}`}></div>
                      </div>
                      <div>
                        <h4 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{freelancer.name}</h4>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{freelancer.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {freelancer.skills.map((skill, index) => (
                        <span key={index} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${theme === 'dark' ? 'bg-navy-800 text-navy-300' : 'bg-navy-50 text-navy-700'}`}>{skill}</span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`fas fa-star text-xs ${i < Math.floor(freelancer.rating) ? 'text-amber-400' : (theme === 'dark' ? 'text-gray-600' : 'text-gray-200')}`}></i>
                        ))}
                      </div>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{freelancer.rating} ({freelancer.reviews} reviews)</span>
                    </div>
                    
                    <div className={`flex justify-between mb-5 p-3 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-700/50' : 'bg-gradient-to-r from-gray-50 to-gray-100/50'}`}>
                      <div className="text-center flex-1">
                        <span className={`block text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{freelancer.completed}</span>
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Projects</span>
                      </div>
                      <div className={`w-px ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
                      <div className="text-center flex-1">
                        <span className="block text-xl font-bold text-emerald-600">100%</span>
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Success</span>
                      </div>
                    </div>
                    
                    <button className="w-full px-5 py-3 bg-gradient-to-r from-navy-800 to-navy-900 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-navy-900/30 hover:-translate-y-0.5 active:scale-95 text-sm">
                      <i className="fas fa-paper-plane mr-2"></i> Hire Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Carousel indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {freelancers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentFreelancerIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  currentFreelancerIndex === idx 
                    ? 'bg-navy-700 w-8' 
                    : (theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400')
                }`}
              />
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={prevFreelancer} className={`w-12 h-12 rounded-xl cursor-pointer transition-all duration-300 hover:bg-navy-700 hover:text-white hover:shadow-lg flex items-center justify-center border ${theme === 'dark' ? 'bg-gray-800 text-navy-400 border-gray-600 hover:border-navy-700' : 'bg-white text-navy-700 border-gray-200 hover:border-navy-700'}`}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <button onClick={nextFreelancer} className={`w-12 h-12 rounded-xl cursor-pointer transition-all duration-300 hover:bg-navy-700 hover:text-white hover:shadow-lg flex items-center justify-center border ${theme === 'dark' ? 'bg-gray-800 text-navy-400 border-gray-600 hover:border-navy-700' : 'bg-white text-navy-700 border-gray-200 hover:border-navy-700'}`}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 relative overflow-hidden" id="testimonials">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-navy-700/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-navy-600/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Success Stories</h2>
            <p className="text-lg text-white/70">See how Milestone has transformed careers and businesses</p>
          </div>
          
          {/* Auto-scrolling testimonials carousel */}
          <div className="relative overflow-hidden">
            <div 
              className="flex gap-6 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentTestimonialIndex * (100 / 3)}%)` }}
            >
              {/* Duplicate testimonials for infinite scroll effect */}
              {[...testimonials, ...testimonials].map((testimonial, idx) => (
                <div 
                  key={idx} 
                  className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-2"
                >
                  <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl text-center border border-white/20 shadow-2xl h-full hover:bg-white/15 transition-all duration-300">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <i className="fas fa-quote-left text-2xl text-white/50"></i>
                    </div>
                    <div className="flex justify-center gap-1 mb-5">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <i key={i} className="fas fa-star text-amber-400"></i>
                      ))}
                    </div>
                    <p className="text-lg leading-relaxed text-white/90 mb-6 font-light">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
                      <div className="text-left">
                        <h4 className="font-bold text-white">{testimonial.name}</h4>
                        <p className="text-sm text-white/60">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Carousel indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentTestimonialIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  currentTestimonialIndex === idx 
                    ? 'bg-white w-8' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={prevTestimonial} className="w-12 h-12 rounded-xl bg-white/10 text-white cursor-pointer transition-all duration-300 hover:bg-white hover:text-navy-900 flex items-center justify-center border border-white/20 backdrop-blur-sm">
              <i className="fas fa-chevron-left"></i>
            </button>
            <button onClick={nextTestimonial} className="w-12 h-12 rounded-xl bg-white/10 text-white cursor-pointer transition-all duration-300 hover:bg-white hover:text-navy-900 flex items-center justify-center border border-white/20 backdrop-blur-sm">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <BlogSection />

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-navy-800 via-navy-700 to-navy-800 text-white text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-8">
            <i className="fas fa-rocket text-amber-400"></i>
            <span className="text-sm font-medium">Start your journey today</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">Ready to Start Your<br />Freelancing Journey?</h2>
          <p className="text-xl mb-10 text-white/80 max-w-2xl mx-auto">Join thousands of freelancers and businesses on Milestone today</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/signup" className="px-10 py-4 bg-white text-navy-800 rounded-xl font-bold no-underline transition-all duration-300 hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1 inline-flex items-center gap-2">
              Get Started Free
              <i className="fas fa-arrow-right"></i>
            </Link>
            <Link to="/jobs" className="px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-bold no-underline transition-all duration-300 hover:bg-white hover:text-navy-800 inline-block">
              Browse Jobs
            </Link>
          </div>
          <p className="mt-8 text-white/50 text-sm">No credit card required • Free forever for freelancers</p>
        </div>
      </section>

      {/* Footer */}
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

export default Home;