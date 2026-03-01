import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../components/DashboardPage';
import FeedbackForm from '../../components/FeedbackForm';
import JobDetailsModal from '../../components/freelancer/JobDetailsModal';
import ColumnToggle, { useColumnToggle } from '../../components/SmartColumnToggle';
import { loadJobHistory, selectJobHistory, selectJobsLoading, selectJobsError } from '../../redux/slices/jobsSlice';
import { checkCanGiveFeedback, selectFeedbackEligibility } from '../../redux/slices/feedbackSlice';
import { useChatContext } from '../../context/ChatContext';

const COLUMNS = [
  { key: 'employer',  label: 'Employer' },
  { key: 'details',   label: 'Job Details' },
  { key: 'status',    label: 'Status' },
  { key: 'earned',    label: 'Earned' },
  { key: 'rating',    label: 'Rating' },
  { key: 'actions',   label: 'Actions' },
];

const SORT_OPTIONS = [
  { value: 'newest',       label: 'Most Recent' },
  { value: 'oldest',       label: 'Oldest First' },
  { value: 'earned-high',  label: 'Earned (High to Low)' },
  { value: 'earned-low',   label: 'Earned (Low to High)' },
  { value: 'rating-high',  label: 'Rating (High to Low)' },
  { value: 'rating-low',   label: 'Rating (Low to High)' },
];

const STATUS_FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'finished', label: 'Completed' },
  { value: 'left',     label: 'Left' },
];

function Stars({ rating = 0 }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div className="flex gap-0.5">
      {[...Array(full)].map((_, i) => <span key={`f${i}`} className="text-amber-400 text-sm">&#9733;</span>)}
      {half === 1 && <span className="text-amber-400 text-sm">&#189;</span>}
      {[...Array(empty)].map((_, i) => <span key={`e${i}`} className="text-gray-300 text-sm">&#9734;</span>)}
    </div>
  );
}

export default function FreelancerJobHistory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();
  const jobs = useSelector(selectJobHistory);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const feedbackEligibilityMap = useSelector((state) => state.feedback.eligibilityByJob || {});

  const [feedbackModal, setFeedbackModal] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');

  const cols = useColumnToggle(COLUMNS, 'job-history-cols');

  useEffect(() => { dispatch(loadJobHistory()); }, [dispatch]);

  useEffect(() => {
    if (jobs?.length > 0) {
      jobs.forEach(job => {
        const jobId = job._id || job.id;
        dispatch(checkCanGiveFeedback(jobId));
      });
    }
  }, [jobs, dispatch]);

  const stats = useMemo(() => {
    if (!jobs?.length) return { total: 0, totalEarned: 0, completed: 0, left: 0, avgRating: 0 };
    const completed = jobs.filter(j => j.status === 'finished').length;
    const left = jobs.filter(j => j.status === 'left').length;
    const totalEarned = jobs.reduce((s, j) => s + (j.paidAmount || 0), 0);
    const ratedJobs = jobs.filter(j => j.rating && typeof j.rating === 'number');
    const avgRating = ratedJobs.length > 0 ? (ratedJobs.reduce((s, j) => s + j.rating, 0) / ratedJobs.length) : 0;
    return { total: jobs.length, totalEarned, completed, left, avgRating };
  }, [jobs]);

  const processedJobs = useMemo(() => {
    let list = jobs || [];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(j => j.status === statusFilter);
    }

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.tech?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    const sorted = [...list];
    switch (sortBy) {
      case 'newest':      sorted.sort((a, b) => new Date(b.endDateRaw || b.startDateRaw || 0) - new Date(a.endDateRaw || a.startDateRaw || 0)); break;
      case 'oldest':      sorted.sort((a, b) => new Date(a.endDateRaw || a.startDateRaw || 0) - new Date(b.endDateRaw || b.startDateRaw || 0)); break;
      case 'earned-high': sorted.sort((a, b) => (b.paidAmount || 0) - (a.paidAmount || 0)); break;
      case 'earned-low':  sorted.sort((a, b) => (a.paidAmount || 0) - (b.paidAmount || 0)); break;
      case 'rating-high': sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'rating-low':  sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0)); break;
    }
    return sorted;
  }, [jobs, searchTerm, sortBy, statusFilter]);

  const handleChat = (job) => {
    const userId = job.employerUserId || job.employer?.userId;
    if (userId) openChatWith(userId);
    else alert('Unable to start chat: Employer information not available');
  };

  const getStatusBadge = (status) => {
    if (status === 'finished') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>Completed</span>;
    if (status === 'left') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>Left</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{status}</span>;
  };

  return (
    <DashboardPage title="Job History">
      <p className="text-gray-500 -mt-6 mb-6">View your completed and past jobs</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Jobs</p>
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
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Job Rating</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-lg font-bold text-emerald-600">{stats.completed} Completed</p>
              <p className="text-xs text-red-500 font-medium">{stats.left} Left</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Sort + Filter + Columns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search by job title, company, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/* Status Filter */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${statusFilter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ColumnToggle columns={COLUMNS} visible={cols.visible} onChange={cols.setVisible} storageKey="job-history-cols" />
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
            <p className="text-gray-500 text-sm">Loading job history...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-gray-800 font-medium mb-1">Failed to load job history</p>
            <p className="text-gray-500 text-sm mb-4">{typeof error === 'string' ? error : error?.message || 'Unknown error'}</p>
            <button onClick={() => dispatch(loadJobHistory())} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
          </div>
        ) : (!jobs || jobs.length === 0) ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <p className="text-gray-800 font-medium mb-1">No job history</p>
            <p className="text-gray-500 text-sm">You haven't completed any jobs yet.</p>
          </div>
        ) : processedJobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-800 font-medium mb-1">No matching jobs</p>
            <p className="text-gray-500 text-sm mb-3">Try adjusting your search or filters</p>
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Clear Filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                  {cols.visible.has('employer') && <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Employer</th>}
                  {cols.visible.has('details')  && <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Job Details</th>}
                  {cols.visible.has('status')   && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>}
                  {cols.visible.has('earned')   && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Earned</th>}
                  {cols.visible.has('rating')   && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Rating</th>}
                  {cols.visible.has('actions')  && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedJobs.map((job) => {
                  const jobId = job._id || job.id;
                  const eligibility = feedbackEligibilityMap[jobId];
                  return (
                    <tr key={jobId} className="hover:bg-gray-50 transition-colors">
                      {cols.visible.has('employer') && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img src={job.logo || '/assets/company_logo.jpg'} alt={job.company} className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" onError={(e) => { e.target.src = '/assets/company_logo.jpg'; }} />
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
                          <div className="text-xs space-y-1 text-gray-600">
                            <div>{job.date || 'N/A'}</div>
                            {job.cancelReason && <div className="text-red-600 text-[11px]">{job.cancelReason}</div>}
                          </div>
                        </td>
                      )}
                      {cols.visible.has('status') && (
                        <td className="px-5 py-4 text-center">{getStatusBadge(job.status)}</td>
                      )}
                      {cols.visible.has('earned') && (
                        <td className="px-5 py-4 text-center">
                          {job.paidAmount > 0 ? (
                            <span className="text-sm font-bold text-green-600">{'\u20B9'}{(job.paidAmount || 0).toLocaleString()}</span>
                          ) : (
                            <span className="text-sm font-medium text-red-500">Not paid</span>
                          )}
                          {job.totalBudget > 0 && (
                            <p className="text-[10px] text-gray-400">of {'\u20B9'}{job.totalBudget.toLocaleString()}</p>
                          )}
                        </td>
                      )}
                      {cols.visible.has('rating') && (
                        <td className="px-5 py-4 text-center">
                          {job.rating && typeof job.rating === 'number' ? (
                            <div className="flex flex-col items-center">
                              <Stars rating={job.rating} />
                              <span className="text-[10px] text-gray-500 mt-0.5">{job.rating.toFixed(1)}/5</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      {cols.visible.has('actions') && (
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              Details
                            </button>
                            <button onClick={() => handleChat(job)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                              Chat
                            </button>
                            {eligibility?.canGiveFeedback && (
                              <button
                                onClick={() => setFeedbackModal({ jobId, toUserId: eligibility.counterparty.userId, toRole: eligibility.counterparty.role, counterpartyName: eligibility.counterparty.name })}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                Feedback
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && jobs?.length > 0 && (
        <p className="text-xs text-gray-400 text-right mt-2">
          Showing {processedJobs.length} of {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <FeedbackForm
              jobId={feedbackModal.jobId}
              toUserId={feedbackModal.toUserId}
              toRole={feedbackModal.toRole}
              counterpartyName={feedbackModal.counterpartyName}
              onSuccess={() => { setFeedbackModal(null); dispatch(checkCanGiveFeedback(feedbackModal.jobId)); }}
              onCancel={() => setFeedbackModal(null)}
            />
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={selectedJob}
          onJobLeft={() => dispatch(loadJobHistory())}
          showLeaveButton={false}
        />
      )}
    </DashboardPage>
  );
}
