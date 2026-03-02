import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardPage from '../../../components/DashboardPage';
import JobDetailsModal from '../../../components/freelancer/JobDetailsModal';
import SmartColumnToggle, { useSmartColumnToggle } from '../../../components/SmartColumnToggle';
import SmartSearchInput from '../../../components/SmartSearchInput';
import SmartFilter from '../../../components/SmartFilter';
import { useChatContext } from '../../../context/ChatContext';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const COLUMNS = [
  { key: 'employer',   label: 'Employer' },
  { key: 'details',    label: 'Job Details' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'budget',     label: 'Budget' },
  { key: 'progress',   label: 'Progress' },
  { key: 'chat',       label: 'Chat',         defaultVisible: false },
  { key: 'actions',    label: 'Actions' },
];

const APPLICATIONS_COLUMNS = [
  { key: 'jobInfo',     label: 'Job Information' },
  { key: 'status',      label: 'Status' },
  { key: 'appliedDate', label: 'Applied Date' },
  { key: 'budget',      label: 'Budget' },
  { key: 'jobType',     label: 'Job Type' },
  { key: 'actions',     label: 'Actions' },
];

const SORT_OPTIONS = [
  { value: 'newest',      label: 'Date Started (Newest)' },
  { value: 'oldest',      label: 'Date Started (Oldest)' },
  { value: 'budget-high', label: 'Budget (High to Low)' },
  { value: 'budget-low',  label: 'Budget (Low to High)' },
  { value: 'progress-high', label: 'Progress (High to Low)' },
  { value: 'progress-low',  label: 'Progress (Low to High)' },
  { value: 'days-high',   label: 'Days Active (Most)' },
  { value: 'days-low',    label: 'Days Active (Least)' },
];

const APPLICATIONS_SORT_OPTIONS = [
  { value: 'date-newest', label: 'Applied Date (Newest)' },
  { value: 'date-oldest', label: 'Applied Date (Oldest)' },
  { value: 'budget-high', label: 'Budget (High to Low)' },
  { value: 'budget-low',  label: 'Budget (Low to High)' },
  { value: 'status',      label: 'Status' },
];

const FreelancerActiveJobs = () => {
  const { openChatWith } = useChatContext();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('applications');
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState(null);
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [appSortBy, setAppSortBy] = useState('date-newest');
  const [appColumnFilters, setAppColumnFilters] = useState({ status: [], jobType: [] });
  const [appDateFilter, setAppDateFilter] = useState('');

  const setAppColFilter = (field) => (values) =>
    setAppColumnFilters((prev) => ({ ...prev, [field]: values }));

  const cols = useSmartColumnToggle(COLUMNS, 'active-jobs-cols');
  const appCols = useSmartColumnToggle(APPLICATIONS_COLUMNS, 'applications-cols');

  useEffect(() => { 
    fetchActiveJobs(); 
    fetchApplications();
  }, []);

  const fetchActiveJobs = async () => {
    try {
      setLoading(true); setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/freelancer/active_job/api`, { withCredentials: true });
      if (response.data.success) setJobs(response.data.activeJobs || []);
    } catch (err) {
      setError('Failed to load active work. Please try again.');
    } finally { setLoading(false); }
  };

  const fetchApplications = async () => {
    try {
      setAppsLoading(true); setAppsError(null);
      const response = await axios.get(`${API_BASE_URL}/api/freelancer/applications`, { withCredentials: true });
      if (response.data.success) setApplications(response.data.applications || []);
    } catch (err) {
      setAppsError('Failed to load applications. Please try again.');
    } finally { setAppsLoading(false); }
  };

  const handleSeeMore = (job) => { setSelectedJob(job); setIsModalOpen(true); };
  const handleChat = (job) => {
    if (job.employerUserId) openChatWith(job.employerUserId);
    else alert('Unable to start chat: Employer information not available');
  };
  const handleRaiseComplaint = (job) => navigate('/freelancer/complaint', { state: { job } });
  const handleJobLeft = () => fetchActiveJobs();

  const stats = useMemo(() => ({
    total: jobs.length,
    totalEarned: jobs.reduce((s, j) => s + (j.paidAmount || 0), 0),
    totalBudget: jobs.reduce((s, j) => s + (j.totalBudget || 0), 0),
    avgProgress: jobs.length > 0 ? Math.round(jobs.reduce((s, j) => s + (j.progress || 0), 0) / jobs.length) : 0,
    avgDays: jobs.length > 0 ? Math.round(jobs.reduce((s, j) => s + (j.daysSinceStart || 0), 0) / jobs.length) : 0,
  }), [jobs]);

  const processedJobs = useMemo(() => {
    let list = jobs;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.tech?.some(t => t.toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    switch (sortBy) {
      case 'newest':       sorted.sort((a, b) => new Date(b.startDateRaw || 0) - new Date(a.startDateRaw || 0)); break;
      case 'oldest':       sorted.sort((a, b) => new Date(a.startDateRaw || 0) - new Date(b.startDateRaw || 0)); break;
      case 'budget-high':  sorted.sort((a, b) => (b.totalBudget || 0) - (a.totalBudget || 0)); break;
      case 'budget-low':   sorted.sort((a, b) => (a.totalBudget || 0) - (b.totalBudget || 0)); break;
      case 'progress-high':sorted.sort((a, b) => (b.progress || 0) - (a.progress || 0)); break;
      case 'progress-low': sorted.sort((a, b) => (a.progress || 0) - (b.progress || 0)); break;
      case 'days-high':    sorted.sort((a, b) => (b.daysSinceStart || 0) - (a.daysSinceStart || 0)); break;
      case 'days-low':     sorted.sort((a, b) => (a.daysSinceStart || 0) - (b.daysSinceStart || 0)); break;
    }
    return sorted;
  }, [jobs, searchTerm, sortBy]);

  const appStats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter(a => a.status === 'Pending').length,
    accepted: applications.filter(a => a.status === 'Accepted').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
  }), [applications]);

  const processedApplications = useMemo(() => {
    let list = applications;
    if (appColumnFilters.status.length > 0) {
      list = list.filter(a => appColumnFilters.status.includes(a.status));
    }
    if (appColumnFilters.jobType.length > 0) {
      list = list.filter(a => appColumnFilters.jobType.includes(a.jobType));
    }
    if (appDateFilter) {
      list = list.filter(a => {
        const d = new Date(a.appliedDate);
        const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return local === appDateFilter;
      });
    }
    if (appSearchTerm) {
      const q = appSearchTerm.toLowerCase();
      list = list.filter(a =>
        a.jobTitle?.toLowerCase().includes(q) ||
        a.company?.toLowerCase().includes(q) ||
        a.skillsRequired?.some(s => s.toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    switch (appSortBy) {
      case 'date-newest': sorted.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)); break;
      case 'date-oldest': sorted.sort((a, b) => new Date(a.appliedDate) - new Date(b.appliedDate)); break;
      case 'budget-high': sorted.sort((a, b) => (b.budget || 0) - (a.budget || 0)); break;
      case 'budget-low':  sorted.sort((a, b) => (a.budget || 0) - (b.budget || 0)); break;
      case 'status':      sorted.sort((a, b) => a.status.localeCompare(b.status)); break;
    }
    return sorted;
  }, [applications, appSearchTerm, appSortBy, appColumnFilters, appDateFilter]);

  return (
    <DashboardPage title="My Jobs">
      <p className="text-gray-500 -mt-4 mb-6">Track your job applications and active work</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'applications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Applications ({appStats.total})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'active'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Active Work ({stats.total})
        </button>
      </div>

      {activeTab === 'applications' ? (
        <>
          {/* Applications Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{appStats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{appStats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">{appStats.accepted}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{appStats.rejected}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Sort + Columns */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex-1">
                <SmartSearchInput
                  value={appSearchTerm}
                  onChange={setAppSearchTerm}
                  dataSource={applications || []}
                  getSearchValue={(item) => item.jobTitle || item.title || ''}
                  placeholder="Search by job title, company, or skills..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={appSortBy}
                onChange={(e) => setAppSortBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {APPLICATIONS_SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <SmartColumnToggle columns={APPLICATIONS_COLUMNS} visible={appCols.visible} onChange={appCols.setVisible} storageKey="applications-cols" />
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {appsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
                <p className="text-gray-500 text-sm">Loading applications...</p>
              </div>
            ) : appsError ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-gray-800 font-medium mb-1">Failed to load applications</p>
                <p className="text-gray-500 text-sm mb-4">{appsError}</p>
                <button onClick={fetchApplications} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <p className="text-gray-800 font-medium mb-1">No applications yet</p>
                <p className="text-gray-500 text-sm">You haven't applied for any jobs yet.</p>
              </div>
            ) : processedApplications.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-800 font-medium mb-1">No matching applications</p>
                <p className="text-gray-500 text-sm mb-3">Try adjusting your filters or search criteria</p>
                <button onClick={() => { setAppSearchTerm(''); setAppSortBy('date-newest'); setAppColumnFilters({ status: [], jobType: [] }); setAppDateFilter(''); }} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Clear Filters</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                      {appCols.visible.has('jobInfo') && <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Job Information</th>}
                      {appCols.visible.has('status') && (
                        <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center justify-center gap-1.5">
                            Status
                            <SmartFilter
                              label="Status"
                              data={applications}
                              field="status"
                              selectedValues={appColumnFilters.status}
                              onFilterChange={setAppColFilter('status')}
                            />
                          </div>
                        </th>
                      )}
                      {appCols.visible.has('appliedDate') && (
                        <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center justify-center gap-1.5">
                            Applied Date
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  const input = e.currentTarget.nextElementSibling;
                                  if (input?.showPicker) input.showPicker();
                                  else input?.click();
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  appDateFilter ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title={appDateFilter ? `Filtered: ${appDateFilter}` : 'Filter by date'}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <rect x="3" y="4" width="18" height="18" rx="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                              </button>
                              <input
                                type="date"
                                value={appDateFilter}
                                max={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setAppDateFilter(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              {appDateFilter && (
                                <button
                                  type="button"
                                  onClick={() => setAppDateFilter('')}
                                  className="ml-1 text-blue-600 hover:text-blue-800 text-[10px] font-medium"
                                  title="Clear date filter"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        </th>
                      )}
                      {appCols.visible.has('budget') && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Budget</th>}
                      {appCols.visible.has('jobType') && (
                        <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center justify-center gap-1.5">
                            Job Type
                            <SmartFilter
                              label="Job Type"
                              data={applications}
                              field="jobType"
                              selectedValues={appColumnFilters.jobType}
                              onFilterChange={setAppColFilter('jobType')}
                              valueFormatter={(v) => v.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            />
                          </div>
                        </th>
                      )}
                      {appCols.visible.has('actions') && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {processedApplications.map((app) => (
                      <tr key={app.applicationId} className="hover:bg-gray-50 transition-colors">
                        {appCols.visible.has('jobInfo') && (
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={app.logo || '/assets/company_logo.jpg'} 
                                alt={app.company} 
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" 
                                onError={(e) => { e.target.src = '/assets/company_logo.jpg'; }} 
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{app.jobTitle}</p>
                                <p className="text-xs text-gray-500 truncate">{app.company}</p>
                                {app.skillsRequired?.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {app.skillsRequired.slice(0, 2).map((skill, i) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-100">{skill}</span>
                                    ))}
                                    {app.skillsRequired.length > 2 && <span className="text-[10px] text-gray-400">+{app.skillsRequired.length - 2}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        )}
                        {appCols.visible.has('status') && (
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              app.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                              app.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                        )}
                        {appCols.visible.has('appliedDate') && (
                          <td className="px-5 py-4 text-center">
                            <p className="text-sm text-gray-800">{new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </td>
                        )}
                        {appCols.visible.has('budget') && (
                          <td className="px-5 py-4 text-center">
                            <p className="text-sm font-semibold text-gray-900">{'\u20B9'}{(app.budget || 0).toLocaleString()}</p>
                          </td>
                        )}
                        {appCols.visible.has('jobType') && (
                          <td className="px-5 py-4 text-center">
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{app.jobType || 'N/A'}</span>
                          </td>
                        )}
                        {appCols.visible.has('actions') && (
                          <td className="px-5 py-4 text-center">
                            <button 
                              onClick={() => navigate(`/jobs/${app.jobId}`)} 
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View Job
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Showing x of x — just below the table */}
                <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-400 text-right">
                    Showing {processedApplications.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

        </>
      ) : (
        <>
          {/* Active Work Content */}
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Work</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Earned</p>
              <p className="text-2xl font-bold text-green-600">{'\u20B9'}{stats.totalEarned.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Days</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgDays}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Sort + Columns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <SmartSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              dataSource={jobs || []}
              getSearchValue={(item) => item.title || ''}
              placeholder="Search by job title, company, or skills..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <SmartColumnToggle columns={COLUMNS} visible={cols.visible} onChange={cols.setVisible} storageKey="active-jobs-cols" />
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
            <p className="text-gray-500 text-sm">Loading active work...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-gray-800 font-medium mb-1">Failed to load jobs</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button onClick={fetchActiveJobs} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-gray-800 font-medium mb-1">No active work</p>
            <p className="text-gray-500 text-sm">You don't have any active work at the moment.</p>
          </div>
        ) : processedJobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-800 font-medium mb-1">No matching jobs</p>
            <p className="text-gray-500 text-sm mb-3">Try adjusting your search criteria</p>
            <button onClick={() => setSearchTerm('')} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Clear Search</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                  {cols.visible.has('employer')   && <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Employer</th>}
                  {cols.visible.has('details')    && <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Job Details</th>}
                  {cols.visible.has('milestones')  && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Milestones</th>}
                  {cols.visible.has('budget')     && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Budget</th>}
                  {cols.visible.has('progress')   && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Progress</th>}
                  {cols.visible.has('chat')        && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Chat</th>}
                  {cols.visible.has('actions')    && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    {cols.visible.has('employer') && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={job.logo} alt={job.company} className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" onError={(e) => { e.target.src = '/assets/company_logo.jpg'; }} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                            <p className="text-xs text-gray-500 truncate">{job.company}</p>
                            {job.tech?.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                {job.tech.slice(0, 2).map((t, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-100">{t}</span>
                                ))}
                                {job.tech.length > 2 && <span className="text-[10px] text-gray-400">+{job.tech.length - 2}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    {cols.visible.has('details') && (
                      <td className="px-5 py-4">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>Started: <span className="font-medium text-gray-800">{job.startDate}</span></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span><span className="font-medium text-gray-800">{job.daysSinceStart}</span> days ago</span>
                          </div>
                        </div>
                      </td>
                    )}
                    {cols.visible.has('milestones') && (
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-800">{job.completedMilestones || 0}/{job.milestonesCount || 0}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">completed</p>
                      </td>
                    )}
                    {cols.visible.has('budget') && (
                      <td className="px-5 py-4 text-center">
                        <p className="text-sm font-bold text-gray-900">{'\u20B9'}{(job.totalBudget || 0).toLocaleString()}</p>
                        <p className="text-xs text-green-600 font-medium">{'\u20B9'}{(job.paidAmount || 0).toLocaleString()} received</p>
                      </td>
                    )}
                    {cols.visible.has('progress') && (
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-center">
                          <div className="w-full max-w-[100px] bg-gray-100 rounded-full h-2 mb-1">
                            <div className={`h-2 rounded-full transition-all ${job.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(job.progress || 0, 100)}%` }}></div>
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{job.progress || 0}%</span>
                        </div>
                      </td>
                    )}
                    {cols.visible.has('chat') && (
                      <td className="px-5 py-4 text-center">
                        <button onClick={() => handleChat(job)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                          Chat
                        </button>
                      </td>
                    )}
                    {cols.visible.has('actions') && (
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleSeeMore(job)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Details
                          </button>
                          <button onClick={() => handleRaiseComplaint(job)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                            Complain
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Showing x of x — just below the table */}
            <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-right">
                Showing {processedJobs.length} of {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      </>
      )}

      {selectedJob && (
        <JobDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={selectedJob}
          onJobLeft={handleJobLeft}
        />
      )}
    </DashboardPage>
  );
};

export default FreelancerActiveJobs;
