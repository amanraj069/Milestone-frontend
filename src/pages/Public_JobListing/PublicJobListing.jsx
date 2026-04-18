import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import Footer from '../../components/Home/Footer';
import SolrSearchBar from '../../components/search/SolrSearchBar';
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const PublicJobListing = () => {
  const auth = useAuth();
  const user = auth?.user;
  const getDashboardRoute = auth?.getDashboardRoute;
  const apiBaseUrl = getBackendBaseUrl();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter states
  const [sortBy, setSortBy] = useState('date');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedJobType, setSelectedJobType] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const pageSize = 10;

  // Load jobs whenever page changes
  useEffect(() => {
    loadJobs(currentPage);
  }, [currentPage]);

  // Handle search params from URL
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [jobs, searchTerm, sortBy, selectedExperience, selectedSkills, selectedJobType, isRemote, locationFilter]);

  const loadJobs = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/jobs/api?page=${page}&limit=${pageSize}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        const jobList = Array.isArray(data.jobs) ? data.jobs : [];
        setJobs(jobList);
        setPagination(data.pagination || {
          page,
          limit: pageSize,
          total: jobList.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
        
        // Extract unique skills from all jobs
        const skillsSet = new Set();
        jobList.forEach(job => {
          if (job.description && job.description.skills) {
            job.description.skills.forEach(skill => {
              skillsSet.add(skill);
            });
          }
        });
        // Convert to array and sort alphabetically
        setAvailableSkills(Array.from(skillsSet).sort());
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

    // Apply location filter
    if (locationFilter.trim()) {
      const search = locationFilter.toLowerCase();
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(search)
      );
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

    // Sort filtered results with 4-tier priority ordering
    // Tier 4: Premium subscription + Boosted (highest)
    // Tier 3: Boosted only
    // Tier 2: Premium subscription only
    // Tier 1: Normal jobs (lowest)
    filtered.sort((a, b) => {
      const tierA = a.tier || (a.isSponsored && a.isBoosted ? 4 : a.isBoosted ? 3 : a.isSponsored ? 2 : 1);
      const tierB = b.tier || (b.isSponsored && b.isBoosted ? 4 : b.isBoosted ? 3 : b.isSponsored ? 2 : 1);

      // Always keep tier ordering regardless of selected sort
      if (tierB !== tierA) return tierB - tierA;
      
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

  const goToPage = (page) => {
    if (loading) return;
    if (page < 1 || page > (pagination?.totalPages || 1) || page === currentPage) {
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const totalPages = pagination?.totalPages || 1;
    const page = pagination?.page || currentPage;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }

    if (page >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 border-gray-200 backdrop-blur-md border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-wrap md:flex-nowrap items-center justify-between py-3 gap-y-3">
            <div className="text-2xl md:text-4xl font-bold text-gray-900 order-1">
              <Link to="/" className="hover:text-navy-700 transition-colors">
                Mile<span className="text-navy-700">stone</span>
              </Link>
            </div>
            
            <div className="w-full md:w-auto md:flex-1 max-w-md mx-0 md:mx-8 text-black order-3 md:order-2">
              <SolrSearchBar 
                query={searchTerm}
                onQueryChange={setSearchTerm}
                type="jobs"
                hideToggle={true}
                onSearch={(query) => {
                  if (query.trim()) {
                    navigate(`/search?q=${encodeURIComponent(query)}&type=jobs`);
                  }
                }}
              />
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 order-2 md:order-3">
              {user ? (
                <Link 
                  to={getDashboardRoute()} 
                  className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-lg text-sm md:text-base font-medium no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <i className="fas fa-th-large"></i>
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-lg text-sm md:text-base font-medium no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <i className="fas fa-sign-in-alt"></i>
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 md:pt-24 pb-12 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full py-3 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 font-medium flex items-center justify-center gap-2"
            >
              <i className="fas fa-filter"></i>
              {mobileMenuOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <aside className={`lg:w-80 flex-shrink-0 transition-all ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="rounded-lg border p-6 sticky top-28 bg-white border-gray-200">
                {/* Job Type Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Job type</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer border-gray-300 text-gray-600"
                  >
                    <option value="date">Job type</option>
                    <option value="date">Newest First</option>
                    <option value="salary-desc">Highest Salary</option>
                    <option value="salary-asc">Lowest Salary</option>
                  </select>
                </div>

                {/* Categories Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Categories</h3>
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer border-gray-300 text-gray-600"
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
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Experience Level</h3>
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer border-gray-300 text-gray-600"
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
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.slice(0, 12).map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          selectedSkills.includes(skill)
                            ? 'bg-blue-100 text-blue-600 border border-blue-300'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Location</h3>
                  <input
                    type="text"
                    placeholder="Location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
                  />
                </div>

                {/* Remote Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Remote</h3>
                  <select
                    value={isRemote ? 'remote' : 'all'}
                    onChange={(e) => setIsRemote(e.target.value === 'remote')}
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer border-gray-300 text-gray-600"
                  >
                    <option value="all">Remote</option>
                    <option value="remote">Remote Only</option>
                    <option value="all">All Locations</option>
                  </select>
                </div>
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
                <div className="text-center py-12 rounded-xl shadow-sm p-8 bg-white">
                  <i className="fas fa-search text-6xl mb-4 text-gray-300"></i>
                  <h3 className="text-xl font-semibold mb-2 text-gray-700">
                    No matching jobs found
                  </h3>
                  <p className="text-gray-500">
                    Try different keywords or adjust filters
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <div
                        key={job.jobId}
                        className="rounded-lg border-2 p-4 sm:p-5 hover:shadow-md hover:border-blue-600 transition-all duration-200 bg-white border-gray-200"
                      >
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 min-h-[140px]">
                          
                          {/* Image and Info Group - Always Row */}
                          <div className="flex flex-row gap-4 sm:gap-5 flex-1 min-w-0">
                            {/* Company Logo - Circular */}
                            <div className="flex-shrink-0">
                              <img
                                src={job.imageUrl}
                                alt={job.title}
                                className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-100 mt-1"
                              />
                            </div>

                            {/* Job Info */}
                            <div className="flex-1 min-w-0">
                            {/* 1. Job Title and Badges */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h1 className="text-lg font-bold text-gray-900">
                                {job.title}
                              </h1>
                              {isNewJob(job.postedDate) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                  New
                                </span>
                              )}

                            </div>

                            {/* 2. Salary */}
                            <div className="text-sm font-semibold mb-3 text-black-1000">
                              ₹{job.budget.amount.toLocaleString()}{' '}
                              <span className="text-gray-500 font-normal">/ {job.budget.period}</span>
                            </div>

                            {/* 3. Skills - First 3 */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.description.skills.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700"
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
                        </div>

                        {/* Right Side - Actions */}
                        <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-3 sm:gap-2 mt-4 sm:mt-0 border-t border-gray-100 sm:border-t-0 pt-4 sm:pt-0">
                            {/* Application Count Button - Top */}
                            <button 
                              onClick={() => {
                                // If user is employer, navigate to applications filtered by this job
                                if (user && user.role === 'Employer') {
                                  navigate(`/employer/applications?jobId=${job.jobId}`);
                                }
                              }}
                              className={`w-full sm:w-[120px] px-4 py-2 border-2 border-blue-600 text-blue-600 bg-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                user && user.role === 'Employer' ? 'hover:bg-blue-600 hover:text-white cursor-pointer' : 'cursor-default'
                              }`}
                              title={user && user.role === 'Employer' ? 'Click to view applications' : ''}
                            >
                              {job.applicationCount} applicants
                            </button>

                            {/* See More Button - Middle */}
                            <Link
                              to={`/jobs/${job.jobId}`}
                              className="w-full sm:w-[120px] px-4 py-2 inline-flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap no-underline shadow-sm hover:shadow-md"
                              aria-label={`View details for ${job.title}`}
                            >
                              See more
                            </Link>

                            {/* Posted Date - Bottom Center */}
                            <div className="hidden sm:block text-xs font-medium text-gray-500 text-center mt-1">
                              {getDaysAgo(job.postedDate)}
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => goToPage((pagination?.page || currentPage) - 1)}
                          disabled={loading || !pagination?.hasPrevPage}
                          aria-label="Previous page"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <i className="fas fa-chevron-left text-xs" aria-hidden="true"></i>
                        </button>

                        {getPageNumbers().map((item, index) => {
                          if (item === '...') {
                            return (
                              <span key={`dots-${index}`} className="px-2 text-slate-400 select-none">
                                ...
                              </span>
                            );
                          }

                          const isActive = item === (pagination?.page || currentPage);
                          return (
                            <button
                              key={item}
                              onClick={() => goToPage(item)}
                              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                                  : 'border border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700'
                              }`}
                            >
                              {item}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => goToPage((pagination?.page || currentPage) + 1)}
                          disabled={loading || !pagination?.hasNextPage}
                          aria-label="Next page"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <i className="fas fa-chevron-right text-xs" aria-hidden="true"></i>
                        </button>
                    </div>
                  </div>
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
