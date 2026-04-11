import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';
import SmartSearchInput from '../../../components/SmartSearchInput';

const EmployerJobListings = () => {
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFeature, setSearchFeature] = useState('jobRole');
  const [activeFilter, setActiveFilter] = useState('All Jobs');
  const [sortBy, setSortBy] = useState('newest-posted');
  const [deleteModal, setDeleteModal] = useState({ show: false, jobId: null });
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    loadJobListings();
  }, []);

  const loadJobListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/employer/job-listings`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setJobListings(data.data);
      } else {
        setError(data.error || 'Failed to load job listings');
      }
    } catch (err) {
      console.error('Error loading job listings:', err);
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/employer/job-listings/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setJobListings(jobListings.filter(job => job.jobId !== jobId));
        setDeleteModal({ show: false, jobId: null });
        showNotification('Job listing deleted successfully!', 'success');
      } else {
        showNotification(data.error || 'Failed to delete job listing', 'error');
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      showNotification('Network error. Please try again.', 'error');
    }
  };

  const showNotification = (message, type) => {
    alert(message);
  };

  const getDaysAgo = (dateString) => {
    const days = Math.floor((Date.now() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days} days ago`;
  };

  const normalizeJobType = (jobType) => String(jobType || '').toLowerCase();

  const getSkills = (job) => {
    if (Array.isArray(job?.description?.skills)) return job.description.skills;
    return [];
  };

  const getBudgetValue = (budget) => {
    if (typeof budget === 'number') return budget;
    const cleaned = String(budget || '0').replace(/[^\d.]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const filteredJobs = [...jobListings]
    .filter((job) => {
      const searchLower = searchTerm.trim().toLowerCase();
      const jobTitle = String(job.title || '').toLowerCase();
      const location = String(job.location || '').toLowerCase();
      const skills = getSkills(job).map((skill) => String(skill).toLowerCase());

      const matchesSearch = (() => {
        if (!searchLower) return true;

        if (searchFeature === 'jobRole') {
          return jobTitle.includes(searchLower);
        }

        if (searchFeature === 'skills') {
          return skills.some((skill) => skill.includes(searchLower));
        }

        if (searchFeature === 'location') {
          return location.includes(searchLower);
        }

        return (
          jobTitle.includes(searchLower) ||
          location.includes(searchLower) ||
          skills.some((skill) => skill.includes(searchLower))
        );
      })();

      const jobType = normalizeJobType(job.jobType);
      const matchesFilter = (() => {
        switch (activeFilter) {
          case 'All Jobs':
            return true;
          case 'Remote':
            return Boolean(job.remote) || jobType.includes('remote');
          case 'Full-time':
            return jobType.includes('full-time') || jobType.includes('full time');
          case 'Part-time':
            return jobType.includes('part-time') || jobType.includes('part time');
          case 'Contract':
            return jobType.includes('contract');
          case 'Freelance':
            return jobType.includes('freelance');
          default:
            return true;
        }
      })();

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest-posted':
          return new Date(a.postedDate || 0) - new Date(b.postedDate || 0);
        case 'newest-posted':
          return new Date(b.postedDate || 0) - new Date(a.postedDate || 0);
        case 'budget-high-low':
          return getBudgetValue(b.budget) - getBudgetValue(a.budget);
        case 'budget-low-high':
          return getBudgetValue(a.budget) - getBudgetValue(b.budget);
        default:
          return 0;
      }
    });

  return (
    <DashboardPage 
      title="Job Listings"
      headerAction={null}
    >
      <div className="mb-5 sm:mb-6 mt-3 sm:mt-8 flex items-center justify-between gap-3">
        <p className="text-gray-600 text-sm sm:text-base flex-1">Browse and manage your posted job opportunities</p>
        <Link
          to="/employer/job-listings/new"
          title="Post New Job"
          aria-label="Post New Job"
          className="h-10 w-10 sm:h-auto sm:w-auto sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm"
        >
          <i className="fas fa-plus"></i>
          <span className="hidden sm:inline">Post New Job</span>
        </Link>
      </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              <div className="flex-1 min-w-0">
                <SmartSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  selectedFeature={searchFeature}
                  onFeatureChange={setSearchFeature}
                  dataSource={jobListings}
                  searchFields={
                    [
                      { key: 'jobRole', label: 'Job Role', getValue: (item) => item.title || '' },
                      { key: 'skills', label: 'Skills', getValue: (item) => item?.description?.skills || [] },
                      { key: 'location', label: 'Location', getValue: (item) => item.location || '' },
                    ]
                  }
                  placeholder="Search jobs, skills, location..."
                />
              </div>

              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full lg:w-auto h-9 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="All jobs filter"
              >
                <option>All Jobs</option>
                <option>Remote</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Freelance</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full lg:w-auto h-9 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Sort jobs"
              >
                <option value="oldest-posted">Oldest Posted</option>
                <option value="newest-posted">Newest Posted</option>
                <option value="budget-high-low">Budget High-Low</option>
                <option value="budget-low-high">Budget Low-High</option>
              </select>
            </div>
          </div>

          {/* Job Listings */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <i className="fas fa-spinner fa-spin text-5xl text-blue-600 mb-4"></i>
                <p className="text-gray-600 text-lg">Loading job listings...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Job Listings</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadJobListings}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
                >
                  <i className="fas fa-refresh mr-2"></i>
                  Try Again
                </button>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <i className="fas fa-briefcase text-5xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Job Listings Found</h3>
                <p className="text-gray-600 mb-4">
                  {jobListings.length === 0 
                    ? 'Start by posting your first job opportunity!' 
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {jobListings.length === 0 && (
                  <Link
                    to="/employer/job-listings/new"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Post New Job
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <div
                    key={job.jobId}
                    className={`border-2 rounded-xl p-4 sm:p-5 transition-all hover:shadow-lg flex flex-col md:flex-row gap-4 sm:gap-5 items-start md:items-center ${
                      job.isBoosted
                        ? 'border-yellow-400 shadow-md shadow-yellow-100 hover:border-yellow-500'
                        : 'border-gray-200 hover:border-blue-600'
                    }`}
                  >
                    <div className="flex-shrink-0 self-center md:self-start">
                      <img
                        src={job.imageUrl || '/assets/company_logo.jpg'}
                        alt="Company"
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 break-words">
                        {job.title}
                        <span className="ml-2 text-xs sm:text-sm font-normal text-gray-500">
                          ({job.applicationCount || 0}/{job.applicationCap != null ? job.applicationCap : <span className="text-base">∞</span>})
                        </span>
                      </h3>
                      <div className="text-blue-600 font-semibold text-base sm:text-lg mb-3">
                        ₹{typeof job.budget === 'number' ? job.budget.toLocaleString('en-IN') : job.budget}
                      </div>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {getSkills(job).slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 sm:gap-4 text-gray-600 text-xs sm:text-sm flex-wrap">
                        <span className="flex items-center gap-2">
                          <i className="fas fa-map-marker-alt text-blue-600"></i>
                          {job.location || 'Not specified'}
                        </span>
                        <span className="flex items-center gap-2">
                          <i className="fas fa-briefcase text-blue-600"></i>
                          {job.jobType}
                        </span>
                        <span className="flex items-center gap-2">
                          <i className="fas fa-calendar text-blue-600"></i>
                          Posted {getDaysAgo(job.postedDate)}
                        </span>
                        {job.remote && (
                          <span className="flex items-center gap-2 text-green-600">
                            <i className="fas fa-home"></i>
                            Remote
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex-shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 items-stretch md:min-w-[140px]">
                      <button
                        onClick={() => navigate(`/employer/applications?jobId=${job.jobId}`)}
                        className="w-full border-2 border-blue-600 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-semibold whitespace-nowrap flex items-center justify-center gap-2 text-sm"
                      >
                        <i className="fas fa-users"></i>
                        <span>{job.applicationCount || 0} applicants</span>
                      </button>
                      <button
                        onClick={() => navigate(`/jobs/${job.jobId}`)}
                        className="w-full border-2 border-blue-600 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-medium text-sm"
                      >
                        <i className="fas fa-eye mr-2"></i>View
                      </button>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => navigate(`/employer/job-listings/edit/${job.jobId}`)}
                          title="Edit"
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all font-medium text-sm flex items-center justify-center gap-1"
                        >
                          <i className="fas fa-edit"></i>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteModal({ show: true, jobId: job.jobId })}
                          title="Delete"
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-all font-medium text-sm flex items-center justify-center gap-1"
                        >
                          <i className="fas fa-trash"></i>
                          <span>Del</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-8 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Delete Job Listing</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this job listing? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setDeleteModal({ show: false, jobId: null })}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-semibold"
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteModal.jobId)}
                  className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold"
                >
                  <i className="fas fa-check mr-2"></i>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
};

export default EmployerJobListings;