import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';

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
  const [sortBy, setSortBy] = useState('recent'); // 'recent','oldest','budget-high-low','budget-low-high','applicants-high-low','applicants-low-high'
  const [deleting, setDeleting] = useState(null);
  
  // SmartFilter states for columns
  const [titleFilters, setTitleFilters] = useState([]);
  const [companyFilters, setCompanyFilters] = useState([]);
  const [typeFiltersColumn, setTypeFiltersColumn] = useState([]);
  const [statusFiltersColumn, setStatusFiltersColumn] = useState([]);

  // Column toggle (persistent)
  const columnsDef = [
    { key: 'title', label: 'Job Title', defaultVisible: true },
    { key: 'company', label: 'Company', defaultVisible: true },
    { key: 'budget', label: 'Budget', defaultVisible: true },
    { key: 'type', label: 'Type', defaultVisible: true },
    { key: 'status', label: 'Status', defaultVisible: true },
    { key: 'posted', label: 'Posted', defaultVisible: true },
    { key: 'applicants', label: 'Applicants', defaultVisible: true },
    { key: 'actions', label: 'Actions', defaultVisible: true },
  ];

  const { visible: visibleColumns, setVisible: setVisibleColumns } = useSmartColumnToggle(columnsDef, 'moderator_job_listings_columns');
  
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

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSortBy('recent');
    setTitleFilters([]);
    setCompanyFilters([]);
    setTypeFiltersColumn([]);
    setStatusFiltersColumn([]);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== '' || sortBy !== 'recent' ||
    titleFilters.length > 0 || companyFilters.length > 0 || typeFiltersColumn.length > 0 || statusFiltersColumn.length > 0;

  // Fuzzy search filter and sort
  let filteredJobs = jobs.filter(job => {
    // Column filters (SmartFilter)
    if (titleFilters.length > 0 && !titleFilters.includes(job.title || '')) {
      return false;
    }
    if (companyFilters.length > 0 && !companyFilters.includes(job.companyName || '')) {
      return false;
    }
    if (typeFiltersColumn.length > 0 && !typeFiltersColumn.includes(job.jobType || '')) {
      return false;
    }
    if (statusFiltersColumn.length > 0 && !statusFiltersColumn.includes(job.status || '')) {
      return false;
    }
    
    // (status/type filters removed — use column filters)

    // Regex search across all fields
    if (searchTerm.trim() === '') {
      return true;
    }

    try {
      const regex = new RegExp(searchTerm, 'i');
      return (
        regex.test(job.title || '') ||
        regex.test(job.companyName || '') ||
        regex.test(job.location || '') ||
        regex.test(job.jobType || '')
      );
    } catch (e) {
      // Invalid regex, fall back to includes
      const searchLower = searchTerm.toLowerCase();
      return (
        (job.title || '').toLowerCase().includes(searchLower) ||
        (job.companyName || '').toLowerCase().includes(searchLower) ||
        (job.location || '').toLowerCase().includes(searchLower) ||
        (job.jobType || '').toLowerCase().includes(searchLower)
      );
    }
  });

  // Apply sorting
  if (sortBy === 'budget-low-high') {
    filteredJobs = [...filteredJobs].sort((a, b) => (Number(a.budget) || 0) - (Number(b.budget) || 0));
  } else if (sortBy === 'budget-high-low') {
    filteredJobs = [...filteredJobs].sort((a, b) => (Number(b.budget) || 0) - (Number(a.budget) || 0));
  } else if (sortBy === 'applicants-high-low') {
    filteredJobs = [...filteredJobs].sort((a, b) => (Number(b.applicantsCount) || 0) - (Number(a.applicantsCount) || 0));
  } else if (sortBy === 'applicants-low-high') {
    filteredJobs = [...filteredJobs].sort((a, b) => (Number(a.applicantsCount) || 0) - (Number(b.applicantsCount) || 0));
  } else if (sortBy === 'recent') {
    filteredJobs = [...filteredJobs].sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
  } else if (sortBy === 'oldest') {
    filteredJobs = [...filteredJobs].sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
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
      <p className="text-gray-500 mt-1">View and manage all job postings</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-briefcase text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Jobs</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{totalJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-wallet text-yellow-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Budget</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 leading-tight break-all">Rs.{totalBudget.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-list-alt text-purple-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Open Jobs</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{openJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-building text-emerald-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Companies Hiring</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{companiesHiring}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Filters Row (kept empty for spacing) */}
        <div className="flex items-center gap-4">
        </div>

        {/* Search Row with Sort and Column Toggle */}
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="text-xs text-gray-500">Sort By</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Recent Posted</option>
              <option value="oldest">Oldest Posted</option>
              <option value="budget-high-low">Budget High - Low</option>
              <option value="budget-low-high">Budget Low - High</option>
              <option value="applicants-high-low">Applicants High - Low</option>
              <option value="applicants-low-high">Applicants Low - High</option>
            </select>

            <button
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className={`px-3 py-2 rounded-md text-sm font-medium border ${hasActiveFilters ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'}`}
            >
              Clear Filters
            </button>
          </div>

          <div className="w-full lg:w-auto lg:ml-auto">
            <SmartColumnToggle
              columns={columnsDef}
              visible={visibleColumns}
              onChange={setVisibleColumns}
              storageKey="moderator_job_listings_columns"
            />
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
            {hasActiveFilters ? 'No jobs match your filters.' : 'There are no job listings.'}
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
                    {visibleColumns.has('title') && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <div className="flex items-center gap-2">
                          Job Title
                          <SmartFilter
                            label="Filter"
                            data={jobs}
                            field="title"
                            selectedValues={titleFilters}
                            onFilterChange={setTitleFilters}
                          />
                        </div>
                      </th>
                    )}

                    {visibleColumns.has('company') && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <div className="flex items-center gap-2">
                          Company
                          <SmartFilter
                            label="Filter"
                            data={jobs}
                            field="companyName"
                            selectedValues={companyFilters}
                            onFilterChange={setCompanyFilters}
                          />
                        </div>
                      </th>
                    )}

                    {visibleColumns.has('budget') && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                    )}

                    {visibleColumns.has('type') && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <div className="flex items-center gap-2">
                          Type
                          <SmartFilter
                            label="Filter"
                            data={jobs}
                            field="jobType"
                            selectedValues={typeFiltersColumn}
                            onFilterChange={setTypeFiltersColumn}
                          />
                        </div>
                      </th>
                    )}

                    {visibleColumns.has('status') && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <div className="flex items-center gap-2">
                          Status
                          <SmartFilter
                            label="Filter"
                            data={jobs}
                            field="status"
                            selectedValues={statusFiltersColumn}
                            onFilterChange={setStatusFiltersColumn}
                          />
                        </div>
                      </th>
                    )}

                    {visibleColumns.has('posted') && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posted</th>
                    )}

                    {visibleColumns.has('applicants') && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicants</th>
                    )}

                    {visibleColumns.has('actions') && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-gray-50">
                    {visibleColumns.has('title') && (
                      <td className="px-4 py-3 font-medium text-gray-900">{job.title}</td>
                    )}
                    {visibleColumns.has('company') && (
                      <td className="px-4 py-3 text-gray-600">{job.companyName}</td>
                    )}
                    {visibleColumns.has('budget') && (
                      <td className="px-4 py-3 text-gray-600">Rs.{Number(job.budget || 0).toFixed(2)}</td>
                    )}
                    {visibleColumns.has('type') && (
                      <td className="px-4 py-3 text-gray-600">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{job.jobType}</span>
                      </td>
                    )}
                    {visibleColumns.has('status') && (
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
                    )}
                    {visibleColumns.has('posted') && (
                      <td className="px-4 py-3 text-gray-600">{new Date(job.postedDate).toLocaleDateString()}</td>
                    )}
                    {visibleColumns.has('applicants') && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => fetchApplicants(job.jobId, job.title)}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          disabled={loadingApplicants}
                        >
                          {job.applicantsCount || 0}
                        </button>
                      </td>
                    )}
                    {visibleColumns.has('actions') && (
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Showing count moved to table footer */}
          <div className="px-4 py-3 text-sm text-gray-600">Showing: {filteredJobs.length} of {totalJobs}</div>
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

