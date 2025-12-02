import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/Home/Footer';

const PublicJobListing = () => {
  const auth = useAuth();
  const user = auth?.user;
  const getDashboardRoute = auth?.getDashboardRoute;
  
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [visibleJobsCount, setVisibleJobsCount] = useState(6);

  // Filter states
  const [sortBy, setSortBy] = useState('date');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedJobType, setSelectedJobType] = useState('');
  const [isRemote, setIsRemote] = useState(false);

  // Available skills for filter
  const availableSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS',
    'Docker', 'Git', 'TypeScript', 'Vue.js', 'Angular', 'Flutter',
    'Kotlin', 'Figma', 'Sketch', 'Blender', 'SEO', 'SEM', 'Pandas'
  ];

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
    // Ensure light mode on mount
    document.documentElement.classList.remove('dark');
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.body.className = theme + '-mode';
  }, [theme]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [jobs, searchTerm, sortBy, selectedExperience, selectedSkills, selectedJobType, isRemote]);

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

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const loadMoreJobs = () => {
    setVisibleJobsCount(prev => prev + 3);
  };

  const isNewJob = (postedDate) => {
    const now = new Date();
    const posted = new Date(postedDate);
    const hoursDiff = (now - posted) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const getDaysAgo = (postedDate) => {
    const now = new Date();
    const posted = new Date(postedDate);
    const daysDiff = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'Posted Today';
    if (daysDiff === 1) return '1 Day Ago';
    return `${daysDiff} Days Ago`;
  };

  const applyFiltersAndSort = () => {
    let filtered = [...jobs];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(search) ||
        job.description.skills.some(skill => skill.toLowerCase().includes(search))
      );
    }

    // Apply experience filter
    if (selectedExperience) {
      filtered = filtered.filter(job =>
        job.experienceLevel.toLowerCase() === selectedExperience.toLowerCase()
      );
    }

    // Apply job type filter
    if (selectedJobType) {
      filtered = filtered.filter(job =>
        job.jobType === selectedJobType
      );
    }

    // Apply remote filter
    if (isRemote) {
      filtered = filtered.filter(job => job.remote);
    }

    // Apply skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(job =>
        selectedSkills.every(skill =>
          job.description.skills.some(jobSkill =>
            jobSkill.toLowerCase() === skill.toLowerCase()
          )
        )
      );
    }

    // Sort filtered results - sponsored jobs first (newest to oldest), then regular jobs (newest to oldest)
    filtered.sort((a, b) => {
      // First, prioritize sponsored/premium jobs
      if (a.isSponsored && !b.isSponsored) return -1;
      if (!a.isSponsored && b.isSponsored) return 1;
      
      // Within same tier, apply selected sorting
      switch (sortBy) {
        case 'salary-desc':
          return b.budget.amount - a.budget.amount;
        case 'salary-asc':
          return a.budget.amount - b.budget.amount;
        case 'date':
        default:
          // Newest first (descending order)
          return new Date(b.postedDate) - new Date(a.postedDate);
      }
    });

    setFilteredJobs(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className="text-4xl font-bold text-gray-900">
              <Link to="/" className="hover:text-navy-700 transition-colors">
                Mile<span className="text-navy-700">stone</span>
              </Link>
            </div>
            <div className="flex-1 max-w-md mx-8">
              <form className="relative">
                <input 
                  type="text" 
                  placeholder="Search for services..." 
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-full text-sm outline-none transition-all focus:border-navy-700 focus:ring-4 focus:ring-navy-100"
                />
                <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-navy-700 text-white border-none rounded-full w-9 h-9 cursor-pointer transition-all hover:bg-navy-800 flex items-center justify-center">
                  <i className="fas fa-search"></i>
                </button>
              </form>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="bg-transparent border-none text-lg cursor-pointer text-gray-600 transition-colors hover:text-navy-700 p-2"
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

      {/* Main Content */}
      <main className="pt-24 pb-12 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-28">
                {/* Job Type Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Job type</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="date">Job type</option>
                    <option value="date">Newest First</option>
                    <option value="salary-desc">Highest Salary</option>
                    <option value="salary-asc">Lowest Salary</option>
                  </select>
                </div>

                {/* Categories Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="">All categoriers</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                {/* Experience Level Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Experience Level</h3>
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="">All Levels</option>
                    <option value="Entry">Entry Level</option>
                    <option value="Mid">Mid Level</option>
                    <option value="Senior">Senior Level</option>
                    <option value="Expert">Expert Level</option>
                  </select>
                </div>

                {/* Related Tags Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.slice(0, 12).map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          selectedSkills.includes(skill)
                            ? 'bg-orange-100 text-orange-600 border border-orange-300'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Location</h3>
                  <input
                    type="text"
                    placeholder="Location"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Remote Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Remote</h3>
                  <select
                    value={isRemote ? 'remote' : 'all'}
                    onChange={(e) => setIsRemote(e.target.value === 'remote')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="all">Remote</option>
                    <option value="remote">Remote Only</option>
                    <option value="all">All Locations</option>
                  </select>
                </div>

                {/* Filter Jobs Button */}
                <button
                  onClick={() => {
                    // Filters are already applied through useEffect
                  }}
                  className="w-full py-3 bg-blue-100 text-blue-600 rounded-full font-medium hover:bg-blue-400 transition-colors"
                >
                  Filter jobs
                </button>
              </div>
            </aside>

            {/* Job Listings */}
            <section className="flex-1">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading jobs...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm p-8">
                  <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No matching jobs found
                  </h3>
                  <p className="text-gray-500">
                    Try different keywords or adjust filters
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {filteredJobs.slice(0, visibleJobsCount).map((job) => (
                      <div
                        key={job.jobId}
                        className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex gap-5">
                          {/* Company Logo - Circular */}
                          <div className="flex-shrink-0">
                            <img
                              src={job.imageUrl}
                              alt={job.title}
                              className="w-30 h-30 rounded-full object-cover border-2 border-gray-100"
                            />
                          </div>

                          {/* Job Info */}
                          <div className="flex-1 min-w-0">
                            {/* 1. Job Title and New Badge */}
                            <div className="flex items-center gap-2 mb-2">
                              <h1 className="text-lg font-bold text-gray-900">
                                {job.title}
                              </h1>
                              {isNewJob(job.postedDate) && (
                                <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                  New
                                </span>
                              )}
                              {job.isSponsored && (
                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                  Sponsored
                                </span>
                              )}
                            </div>

                            {/* 2. Salary */}
                            <div className="text-sm font-semibold text-black-1000 mb-3">
                              ₹{job.budget.amount.toLocaleString()}{' '}
                              <span className="text-gray-500 font-normal">/ {job.budget.period}</span>
                            </div>

                            {/* 3. Skills - First 3 */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.description.skills.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>

                            {/* 4. Location, Job Type, Remote Info with Icons */}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1.5">
                                <i className="fas fa-map-marker-alt text-blue-600 text-xs"></i>
                                {job.location}
                              </span>
  
                              <span className="flex items-center gap-1.5 capitalize">
                                <i className="fas fa-briefcase text-blue-600 text-xs"></i>
                                {job.jobType === 'full-time' ? 'Full-time' : 
                                 job.jobType === 'part-time' ? 'Part-time' : 
                                 job.jobType === 'contract' ? 'Contract' : 
                                 job.jobType === 'freelance' ? 'Freelance' : 
                                 'Permanent'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <i className="fas fa-user-tie text-blue-600 text-xs"></i>
                                {job.experienceLevel}
                              </span>
                              
                              {job.remote && (
                                <>

                                  <span className="flex items-center gap-1.5">
                                    <i className="fas fa-home text-blue-600 text-xs"></i>
                                    Remote
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Right Side - Actions */}
                          <div className="flex flex-col items-end justify-between min-w-[120px] gap-2">
                            {/* Application Count Button - Top Right */}
                            <button className="px-2 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors">
                              {job.applicationCount} applicants
                            </button>

                            {/* See More Button - Middle Right */}
                            <Link
                              to={`/jobs/${job.jobId}`}
                              className="px-2 py-1 inline-flex items-center justify-center bg-white text-blue-600 border-2 border-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-600 hover:text-white transition-colors whitespace-nowrap no-underline"
                              aria-label={`View details for ${job.title}`}
                            >
                              See more...
                            </Link>

                            {/* Posted Date - Bottom Right */}
                            <div className="text-gray-600 text-xs font-medium">
                              {getDaysAgo(job.postedDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {visibleJobsCount < filteredJobs.length && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={loadMoreJobs}
                        className="px-8 py-3 bg-orange-100 text-orange-600 rounded-full font-medium hover:bg-orange-200 transition-colors"
                      >
                        Load more jobs
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicJobListing;
