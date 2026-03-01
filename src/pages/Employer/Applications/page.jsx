import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';
import ApplicationDetailsModal from '../../../components/employer/ApplicationDetailsModal';
import SmartSearchInput from '../../../components/SmartSearchInput';
import React, { useState, useEffect, useMemo } from 'react';
import DashboardPage from '../../../components/DashboardPage';
import ApplicationDetailsModal from '../../../components/employer/ApplicationDetailsModal';
import ColumnToggle, { useColumnToggle } from '../../../components/ColumnToggle';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const APP_COLUMNS = [
  { key: 'freelancer', label: 'Freelancer' },
  { key: 'job', label: 'Job Details' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Applied Date' },
  { key: 'premium', label: 'Premium', defaultVisible: false },
  { key: 'rating', label: 'Rating', defaultVisible: false },
  { key: 'view', label: 'View' },
  { key: 'resume', label: 'Resume' },
  { key: 'actions', label: 'Actions' },
];

const EmployerApplications = () => {
  const [searchParams] = useSearchParams();
  const jobIdFilter = searchParams.get('jobId');
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchMode, setSearchMode] = useState('freelancer');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  // New filter/sort state
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  const cols = useColumnToggle(APP_COLUMNS, 'employer-apps-cols');

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/employer/job_applications/api/data`, { withCredentials: true });
      if (response.data.success) {
        setApplications(response.data.data.applications);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (applicationId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/employer/job_applications/${applicationId}/accept`, {}, { withCredentials: true });
      if (response.data.success) { fetchApplications(); }
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Failed to accept application');
    }
  };

  const handleReject = async (applicationId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/employer/job_applications/${applicationId}/reject`, {}, { withCredentials: true });
      if (response.data.success) { fetchApplications(); }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
    }
  };

  const handleViewResume = (resumeUrl) => {
    let fullUrl = resumeUrl;
    if (resumeUrl.startsWith('/uploads')) fullUrl = `${API_BASE_URL}${resumeUrl}`;
    window.open(fullUrl, '_blank');
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const filteredApplications = applications.filter(app => {
    let matchesSearch = true;
    if (searchTerm) {
      if (searchMode === 'freelancer') {
        matchesSearch = app.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (searchMode === 'job') {
        matchesSearch = app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
      }
    }
    const matchesJobId = !jobIdFilter || app.jobId === jobIdFilter;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesJob = jobFilter === 'all' || app.jobTitle === jobFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRangeFilter !== 'all' && app.appliedDate) {
      const appliedDate = new Date(app.appliedDate);
      const now = new Date();
      const daysDiff = Math.floor((now - appliedDate) / (1000 * 60 * 60 * 24));
      
      if (dateRangeFilter === '7days') {
        matchesDateRange = daysDiff <= 7;
      } else if (dateRangeFilter === '30days') {
        matchesDateRange = daysDiff <= 30;
      } else if (dateRangeFilter === '90days') {
        matchesDateRange = daysDiff <= 90;
      }
    }
    
    return matchesSearch && matchesJobId && matchesStatus && matchesJob && matchesDateRange;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.appliedDate) - new Date(a.appliedDate);
    } else if (sortBy === 'date-oldest') {
      return new Date(a.appliedDate) - new Date(b.appliedDate);
    } else if (sortBy === 'name') {
      return a.freelancerName?.localeCompare(b.freelancerName);
    } else if (sortBy === 'job') {
      return a.jobTitle?.localeCompare(b.jobTitle);
    }
    return 0;
  });
  
  // Get unique job titles for filter
  const uniqueJobs = [...new Set(applications.map(app => app.jobTitle))].filter(Boolean);

  // Calculate statistics based on jobId filter if present
  const displayStats = jobIdFilter ? {
    total: applications.filter(app => app.jobId === jobIdFilter).length,
    pending: applications.filter(app => app.jobId === jobIdFilter && app.status === 'Pending').length,
    accepted: applications.filter(app => app.jobId === jobIdFilter && app.status === 'Accepted').length,
    rejected: applications.filter(app => app.jobId === jobIdFilter && app.status === 'Rejected').length
  } : stats;
  const uniqueJobs = useMemo(() => {
    const titles = [...new Set(applications.map((a) => a.jobTitle))];
    return titles.sort();
  }, [applications]);

  const filteredApplications = useMemo(() => {
    let list = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.freelancerName?.toLowerCase().includes(term) ||
          a.jobTitle?.toLowerCase().includes(term) ||
          a.freelancerEmail?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (jobFilter !== 'all') {
      list = list.filter((a) => a.jobTitle === jobFilter);
    }

    switch (sortBy) {
      case 'date-desc':
        list.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
        break;
      case 'date-asc':
        list.sort((a, b) => new Date(a.appliedDate) - new Date(b.appliedDate));
        break;
      case 'name-asc':
        list.sort((a, b) => (a.freelancerName || '').localeCompare(b.freelancerName || ''));
        break;
      case 'name-desc':
        list.sort((a, b) => (b.freelancerName || '').localeCompare(a.freelancerName || ''));
        break;
      case 'rating-desc':
        list.sort((a, b) => (b.skillRating || 0) - (a.skillRating || 0));
        break;
      case 'premium-first':
        list.sort((a, b) => {
          if (a.isPremium && !b.isPremium) return -1;
          if (!a.isPremium && b.isPremium) return 1;
          return new Date(a.appliedDate) - new Date(b.appliedDate);
        });
        break;
      default:
        break;
    }

    return list;
  }, [applications, searchTerm, statusFilter, jobFilter, sortBy]);

  const getStatusBadge = (status) => {
    const styles = {
      Pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'PENDING' },
      Accepted: { bg: 'bg-green-100', text: 'text-green-700', label: 'ACCEPTED' },
      Rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'REJECTED' },
    };
    const s = styles[status] || styles.Pending;
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const activeFilters = (statusFilter !== 'all' ? 1 : 0) + (jobFilter !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0);

  return (
    <DashboardPage title="Applications">
      <div className="space-y-4">
        {/* Header */}
        <p className="text-gray-600 text-sm">Review and manage applications for your job listings</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-file-alt text-blue-600 text-lg"></i>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-0.5">Total Applications</p>
                <p className="text-xl font-bold text-gray-900">{displayStats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-clock text-yellow-600 text-lg"></i>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-0.5">Pending Review</p>
                <p className="text-xl font-bold text-gray-900">{displayStats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check-circle text-green-600 text-lg"></i>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-0.5">Accepted</p>
                <p className="text-xl font-bold text-gray-900">{displayStats.accepted}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-times-circle text-red-600 text-lg"></i>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-0.5">Rejected</p>
                <p className="text-xl font-bold text-gray-900">{displayStats.rejected}</p>
              </div>
      <div className="space-y-6">
        <p className="text-gray-600">Review and manage applications for your job listings</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-blue-100">Total</p><p className="text-2xl font-bold mt-1">{stats.total}</p></div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"><i className="fas fa-file-alt text-lg"></i></div>
            </div>
          </div>
          <div className="rounded-xl p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-amber-100">Pending</p><p className="text-2xl font-bold mt-1">{stats.pending}</p></div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"><i className="fas fa-clock text-lg"></i></div>
            </div>
          </div>
          <div className="rounded-xl p-5 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-green-100">Accepted</p><p className="text-2xl font-bold mt-1">{stats.accepted}</p></div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"><i className="fas fa-check-circle text-lg"></i></div>
            </div>
          </div>
          <div className="rounded-xl p-5 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-red-100">Rejected</p><p className="text-2xl font-bold mt-1">{stats.rejected}</p></div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"><i className="fas fa-times-circle text-lg"></i></div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          {/* Top Row: Filters */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Status Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Conditional: Show Job Filter only when NOT viewing specific job */}
            {!jobIdFilter && (
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Position</label>
                <select
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  {uniqueJobs.map((job) => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Conditional: Show Date Range Filter only when viewing specific job */}
            {jobIdFilter && (
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Applied Date</label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>
            )}

            {/* Sort By */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Newest First</option>
                <option value="date-oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                {!jobIdFilter && <option value="job">Job Title</option>}
              </select>
            </div>
          </div>

          {/* Bottom Row: Search */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-medium text-gray-500">Search by:</label>
              <div className="flex bg-gray-100 rounded-md p-1">
                {!jobIdFilter ? (
                  <>
                    <button
                      onClick={() => setSearchMode('freelancer')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        searchMode === 'freelancer' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Freelancer
                    </button>
                    <button
                      onClick={() => setSearchMode('job')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        searchMode === 'job' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Job Title
                    </button>
                  </>
                ) : (
                  <button
                    className="px-3 py-1 text-xs font-medium rounded bg-white text-blue-600 shadow-sm cursor-default"
                  >
                    Freelancer
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <SmartSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                dataSource={jobIdFilter ? applications.filter(app => app.jobId === jobIdFilter) : applications}
                getSearchValue={(app) => 
                  jobIdFilter || searchMode === 'freelancer'
                    ? app.freelancerName || '' 
                    : app.jobTitle || ''
                }
                placeholder={`Search by ${jobIdFilter || searchMode === 'freelancer' ? 'freelancer name' : 'job title'}...`}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredApplications.length}</span> of <span className="font-semibold text-gray-700">{jobIdFilter ? applications.filter(app => app.jobId === jobIdFilter).length : applications.length}</span> applications
            </p>
          </div>
        </div>

        {/* Applications List - Table Layout */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search by name, email, or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-[200px]"
            >
              <option value="all">All Jobs</option>
              {uniqueJobs.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="premium-first">Premium First</option>
            </select>

            <ColumnToggle columns={APP_COLUMNS} visible={cols.visible} onChange={cols.setVisible} storageKey="employer-apps-cols" />

            {activeFilters > 0 && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setJobFilter('all'); }}
                className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                Clear ({activeFilters})
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{filteredApplications.length}</span> of {applications.length} applications
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-600 font-medium">No applications found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Freelancer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Job Details
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Applied Details
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    {cols.visible.has('freelancer') && <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Freelancer</th>}
                    {cols.visible.has('job') && <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Job Details</th>}
                    {cols.visible.has('status') && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>}
                    {cols.visible.has('date') && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Applied</th>}
                    {cols.visible.has('premium') && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Premium</th>}
                    {cols.visible.has('rating') && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Rating</th>}
                    {cols.visible.has('view') && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">View</th>}
                    {cols.visible.has('resume') && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Resume</th>}
                    {cols.visible.has('actions') && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ width: '140px' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApplications.map((application) => (
                    <tr 
                      key={application.applicationId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Freelancer Column */}
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {application.freelancerPicture ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                src={application.freelancerPicture}
                                alt={application.freelancerName}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                                {application.freelancerName?.charAt(0)?.toUpperCase() || 'F'}
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-gray-900">
                              {application.freelancerName || 'Unknown Applicant'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {application.freelancerEmail || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Job Details Column */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">
                          {application.jobTitle}
                        </div>
                        <div className="text-xs text-gray-500">
                          Applied on: {formatDate(application.appliedDate)}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(application.status)}
                      </td>

                      {/* Applied Details - Combined Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(application)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <i className="fas fa-eye mr-1.5"></i>
                            View Application
                          </button>
                          {application.resumeLink ? (
                            <button
                              onClick={() => handleViewResume(application.resumeLink)}
                              className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors"
                            >
                              <i className="fas fa-file-pdf mr-1.5"></i>
                              View Resume
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-3 text-center">
                        {application.status === 'Pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAccept(application.applicationId)}
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                              title="Accept Application"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              onClick={() => handleReject(application.applicationId)}
                              className="inline-flex items-center justify-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                              title="Reject Application"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    <tr key={application.applicationId} className="hover:bg-gray-50 transition-colors">
                      {cols.visible.has('freelancer') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {application.freelancerPicture ? (
                                <img className="h-10 w-10 rounded-full object-cover border-2 border-white shadow" src={application.freelancerPicture} alt={application.freelancerName} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow">
                                  {application.freelancerName?.charAt(0)?.toUpperCase() || 'F'}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                {application.freelancerName || 'Unknown'}
                                {application.isPremium && (
                                  <span className="text-xs bg-gradient-to-r from-amber-400 to-amber-500 text-white px-1.5 py-0.5 rounded font-bold">PRO</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{application.freelancerEmail || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      {cols.visible.has('job') && (
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{application.jobTitle}</div>
                        </td>
                      )}
                      {cols.visible.has('status') && <td className="px-6 py-4 text-center">{getStatusBadge(application.status)}</td>}
                      {cols.visible.has('date') && (
                        <td className="px-6 py-4 text-center text-sm text-gray-600">{formatDate(application.appliedDate)}</td>
                      )}
                      {cols.visible.has('premium') && (
                        <td className="px-6 py-4 text-center">
                          {application.isPremium ? (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">Premium</span>
                          ) : (
                            <span className="text-xs text-gray-400">Free</span>
                          )}
                        </td>
                      )}
                      {cols.visible.has('rating') && (
                        <td className="px-6 py-4 text-center">
                          {application.skillRating > 0 ? (
                            <span className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-1">
                              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              {application.skillRating}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                      )}
                      {cols.visible.has('view') && (
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleViewDetails(application)} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm">
                            <i className="fas fa-eye mr-1.5"></i>View
                          </button>
                        </td>
                      )}
                      {cols.visible.has('resume') && (
                        <td className="px-6 py-4 text-center">
                          {application.resumeLink ? (
                            <button onClick={() => handleViewResume(application.resumeLink)} className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-all shadow-sm">
                              <i className="fas fa-file-pdf mr-1.5"></i>Resume
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      {cols.visible.has('actions') && (
                        <td className="px-6 py-4">
                          {application.status === 'Pending' ? (
                            <div className="flex flex-col gap-1.5">
                              <button onClick={() => handleAccept(application.applicationId)} className="inline-flex items-center justify-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all shadow-sm">
                                <i className="fas fa-check mr-1.5"></i>Accept
                              </button>
                              <button onClick={() => handleReject(application.applicationId)} className="inline-flex items-center justify-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-all shadow-sm">
                                <i className="fas fa-times mr-1.5"></i>Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDetailsModal && selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => { setShowDetailsModal(false); setSelectedApplication(null); }}
        />
      )}
    </DashboardPage>
  );
};

export default EmployerApplications;
export { EmployerApplications };
