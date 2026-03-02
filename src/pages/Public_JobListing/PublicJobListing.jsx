import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import Footer from '../../components/Home/Footer';

const PublicJobListing = () => {
  const auth = useAuth();
  const user = auth?.user;
  const getDashboardRoute = auth?.getDashboardRoute;
  const [searchParams] = useSearchParams();
  
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleJobsCount, setVisibleJobsCount] = useState(6);
  const [availableSkills, setAvailableSkills] = useState([]);

  // Filter states
  const [sortBy, setSortBy] = useState('date');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedJobType, setSelectedJobType] = useState('');
  const [isRemote, setIsRemote] = useState(false);

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
  }, []);

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
  }, [jobs, searchTerm, sortBy, selectedExperience, selectedSkills, selectedJobType, isRemote]);

  const loadJobs = async () => {
    try {
      const response = await fetch('http://localhost:9000/api/jobs/api', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        
        // Extract unique skills from all jobs
        const skillsSet = new Set();
        data.jobs.forEach(job => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 border-gray-200 backdrop-blur-md border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className="text-4xl font-bold text-gray-900">
              <Link to="/" className="hover:text-navy-700 transition-colors">
                Mile<span className="text-navy-700">stone</span>
              </Link>
            </div>
            <div className="flex-1 max-w-md mx-8">
              <form className="relative" onSubmit={handleSearch}>
                <input 
                  type="text" 
                  placeholder="Search for services..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-3 border-2 rounded-full text-sm outline-none transition-all focus:border-navy-700 focus:ring-4 focus:ring-navy-100 border-gray-200"
                />
                <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-navy-700 text-white border-none rounded-full w-9 h-9 cursor-pointer transition-all hover:bg-navy-800 flex items-center justify-center shrink-0">
                  <i className="fas fa-search"></i>
                </button>
              </form>
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

      {/* Main Content */}
      <main className="pt-24 pb-12 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="rounded-lg border p-6 sticky top-28 bg-white border-gray-200">
                {/* Job Type Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Job type</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer border-gray-300 text-gray-600"
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
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer border-gray-300 text-gray-600"
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
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer border-gray-300 text-gray-600"
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
                            ? 'bg-orange-100 text-orange-600 border border-orange-300'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-orange-300 hover:bg-orange-50'
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
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent border-gray-300"
                  />
                </div>

                {/* Remote Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Remote</h3>
                  <select
                    value={isRemote ? 'remote' : 'all'}
                    onChange={(e) => setIsRemote(e.target.value === 'remote')}
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer border-gray-300 text-gray-600"
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
                  className="w-full py-3 bg-blue-100 text-blue-600 rounded-full font-medium hover:bg-blue-400 hover:text-white transition-colors"
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
                    {filteredJobs.slice(0, visibleJobsCount).map((job) => (
                      <div
                        key={job.jobId}
                        className="rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <div className="flex gap-5 min-h-[140px]">
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

                          {/* Right Side - Actions */}
                          <div className="flex flex-col items-end justify-between min-w-[140px]">
                            {/* Application Count - Top Right */}
                            <h4 className="px-2 py-1.5 text-sm font-medium text-gray-700">
                              {job.applicationCount} applicants
                            </h4>

                            {/* Bottom row: Posted Date + See More button */}
                            <div className="flex items-center gap-3">
                              <div className="text-xs font-medium text-gray-600">
                                {getDaysAgo(job.postedDate)}
                              </div>
                              <Link
                                to={`/jobs/${job.jobId}`}
                                className="px-4 py-2 inline-flex items-center justify-center border-2 border-blue-600 rounded-lg text-sm sm:text-base font-semibold hover:bg-blue-600 hover:text-white transition-colors whitespace-nowrap no-underline shadow-sm hover:shadow-md bg-white text-blue-600"
                                aria-label={`View details for ${job.title}`}
                              >
                                See more
                              </Link>
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
