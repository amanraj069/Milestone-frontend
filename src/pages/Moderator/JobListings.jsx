import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

// Add keyframe animations
const modalStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;

// Levenshtein distance algorithm for fuzzy search
const levenshteinDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
};

const ModeratorJobListings = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('title'); // 'title' or 'company'
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [budgetSort, setBudgetSort] = useState('none'); // 'none', 'low-to-high', 'high-to-low'
  const [deleting, setDeleting] = useState(null);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Modal states
  const [applicantsModal, setApplicantsModal] = useState({ show: false, jobId: null, jobTitle: '', applicants: [] });
  const [deleteModal, setDeleteModal] = useState({ show: false, jobId: null, jobTitle: '' });
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/moderator/jobs`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to load job listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (jobId, jobTitle) => {
    try {
      setLoadingApplicants(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/moderator/jobs/${jobId}/applicants`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setApplicantsModal({
          show: true,
          jobId,
          jobTitle,
          applicants: response.data.applicants || []
        });
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
      alert('Failed to load applicants. Please try again.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleDeleteJob = async () => {
    const { jobId } = deleteModal;
    setDeleting(jobId);
    
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/moderator/jobs/${jobId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setJobs(jobs.filter(j => j.jobId !== jobId));
        setDeleteModal({ show: false, jobId: null, jobTitle: '' });
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job listing. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  // Generate autocomplete suggestions based on search term
  const generateSuggestions = (value) => {
    if (!value || value.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = value.toLowerCase();
    const uniqueValues = new Set();
    
    // Get unique values based on search mode
    jobs.forEach(job => {
      const fieldValue = searchMode === 'title' ? job.title : job.companyName;
      uniqueValues.add(fieldValue);
    });

    // Filter and rank suggestions using fuzzy matching
    const rankedSuggestions = Array.from(uniqueValues)
      .map(item => {
        const itemLower = item.toLowerCase();
        const startsWithMatch = itemLower.startsWith(searchLower);
        const includesMatch = itemLower.includes(searchLower);
        const distance = levenshteinDistance(searchLower, itemLower);
        
        // Calculate score (lower is better)
        let score = distance;
        if (startsWithMatch) score -= 1000; // Prioritize starts with
        if (includesMatch) score -= 100; // Then includes
        
        return { item, score, distance };
      })
      .filter(({ distance, item }) => {
        // Show if it's a direct match or fuzzy match within threshold
        const threshold = Math.max(2, Math.floor(searchLower.length * 0.4));
        return item.toLowerCase().includes(searchLower) || distance <= threshold;
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 5) // Limit to 5 suggestions
      .map(({ item }) => item);

    setSuggestions(rankedSuggestions);
    setShowSuggestions(rankedSuggestions.length > 0);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    generateSuggestions(value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setBudgetSort('none');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || typeFilter !== 'all' || budgetSort !== 'none';

  // Fuzzy search filter and sort
  let filteredJobs = jobs.filter(job => {
    // Status filter
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && job.jobType !== typeFilter) {
      return false;
    }

    // Fuzzy search
    if (searchTerm.trim() === '') {
      return true;
    }

    const searchLower = searchTerm.toLowerCase();
    const searchField = searchMode === 'title' ? job.title : job.companyName;
    const fieldLower = searchField.toLowerCase();

    // Direct match
    if (fieldLower.includes(searchLower)) {
      return true;
    }

    // Fuzzy match using Levenshtein distance
    // Allow up to 2 character differences for short strings, more for longer
    const threshold = Math.max(2, Math.floor(searchLower.length * 0.3));
    const distance = levenshteinDistance(searchLower, fieldLower);
    
    return distance <= threshold;
  });

  // Apply budget sorting
  if (budgetSort === 'low-to-high') {
    filteredJobs = [...filteredJobs].sort((a, b) => (Number(a.budget) || 0) - (Number(b.budget) || 0));
  } else if (budgetSort === 'high-to-low') {
    filteredJobs = [...filteredJobs].sort((a, b) => (Number(b.budget) || 0) - (Number(a.budget) || 0));
  }

  const totalJobs = jobs.length;
  const totalBudget = jobs.reduce((s, j) => s + (Number(j.budget) || 0), 0);
  const openJobs = jobs.filter(j => j.status === 'open' || j.status === 'active').length;
  
  // Calculate companies hiring (unique employers with active/open jobs)
  const companiesHiring = new Set(
    jobs
      .filter(j => j.status === 'open' || j.status === 'active')
      .map(j => j.companyName)
  ).size;

  const headerAction = (<div></div>);

  const content = (
    <div className="space-y-6">
      {/* Inject modal animation styles */}
      <style>{modalStyles}</style>
      
      {/* Page Subtitle */}
      <p className="text-gray-500 -mt-6">View and manage all job postings</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Jobs</p>
          <p className="text-2xl font-semibold text-gray-900">{totalJobs}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Budget</p>
          <p className="text-2xl font-semibold text-gray-900">Rs.{totalBudget.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Open Jobs</p>
          <p className="text-2xl font-semibold text-gray-900">{openJobs}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Companies Hiring</p>
          <p className="text-2xl font-semibold text-gray-900">{companiesHiring}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type Filter</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sort by Budget</label>
            <select
              value={budgetSort}
              onChange={(e) => setBudgetSort(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">Default</option>
              <option value="low-to-high">Low to High</option>
              <option value="high-to-low">High to Low</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div>
              <label className="block text-xs font-medium text-transparent mb-1">.</label>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          )}

          <div className="ml-auto text-sm text-gray-500 whitespace-nowrap">
            Showing: {filteredJobs.length} of {totalJobs}
          </div>
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-medium text-gray-500">Search by:</label>
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => {
                  setSearchMode('title');
                  setSearchTerm('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  searchMode === 'title'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Job Title
              </button>
              <button
                onClick={() => {
                  setSearchMode('company');
                  setSearchTerm('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  searchMode === 'company'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Company Name
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={`Search by ${searchMode === 'title' ? 'job title' : 'company name'}... `}
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay to allow clicking on suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="flex-1">{suggestion}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading / Error / Empty States */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading jobs...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-red-600 mb-2">Error loading jobs</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchJobs} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      )}

      {!loading && !error && filteredJobs.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No jobs found</p>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'No jobs match your filters.' 
              : 'There are no job listings.'}
          </p>
        </div>
      )}

      {/* Jobs Table */}
      {!loading && !error && filteredJobs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicants</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{job.title}</td>
                    <td className="px-4 py-3 text-gray-600">{job.companyName}</td>
                    <td className="px-4 py-3 text-gray-600">Rs.{Number(job.budget || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{job.jobType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        job.status === 'open' || job.status === 'active' ? 'bg-green-100 text-green-700' : 
                        job.status === 'closed' ? 'bg-red-100 text-red-700' :
                        job.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(job.postedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => fetchApplicants(job.jobId, job.title)}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        disabled={loadingApplicants}
                      >
                        {job.applicantsCount || 0}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800" 
                          onClick={() => handleViewJob(job.jobId)}
                        >
                          View
                        </button>
                        <button 
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700" 
                          onClick={() => setDeleteModal({ show: true, jobId: job.jobId, jobTitle: job.title })}
                          disabled={deleting === job.jobId}
                        >
                          {deleting === job.jobId ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Applicants Modal */}
      {applicantsModal.show && (
        <div 
          className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn" 
          onClick={() => setApplicantsModal({ show: false, jobId: null, jobTitle: '', applicants: [] })}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden animate-slideUp" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Job Applicants</h3>
                <p className="text-sm text-gray-500 mt-1">{applicantsModal.jobTitle}</p>
              </div>
              <button
                onClick={() => setApplicantsModal({ show: false, jobId: null, jobTitle: '', applicants: [] })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-140px)]">
              {loadingApplicants ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                  <p className="text-gray-500 mt-2">Loading applicants...</p>
                </div>
              ) : applicantsModal.applicants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No applicants yet for this job.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applicantsModal.applicants.map((applicant) => (
                    <div key={applicant.applicationId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <img
                          src={applicant.picture || '/assets/default-avatar.png'}
                          alt={applicant.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => { e.target.src = '/assets/default-avatar.png'; }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{applicant.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              applicant.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                              applicant.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {applicant.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{applicant.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Applied on: {new Date(applicant.appliedDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {/* {applicant.coverMessage && (
                            <p className="text-sm text-gray-600 mt-2 italic">"{applicant.coverMessage}"</p>
                          )} */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setApplicantsModal({ show: false, jobId: null, jobTitle: '', applicants: [] })}
                className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div 
          className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn" 
          onClick={() => setDeleteModal({ show: false, jobId: null, jobTitle: '' })}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-slideUp" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Are you sure you want to delete the job <span className="font-semibold">"{deleteModal.jobTitle}"</span>?
              </p>
              <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, jobId: null, jobTitle: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return <DashboardPage title="Job Listings" headerAction={headerAction}>{content}</DashboardPage>;
};

export default ModeratorJobListings;

