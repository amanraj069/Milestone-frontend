import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../components/DashboardPage';
import FeedbackForm from '../../components/FeedbackForm';
import JobDetailsModal from '../../components/freelancer/JobDetailsModal';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';
import SmartSearchInput from '../../components/SmartSearchInput';
import SmartFilter from '../../components/SmartFilter';
import {
  loadJobHistory,
  selectJobHistory,
  selectJobHistoryMeta,
  selectJobsLoading,
  selectJobsError,
} from '../../redux/slices/jobsSlice';
import { checkCanGiveFeedback, selectFeedbackEligibility } from '../../redux/slices/feedbackSlice';
import { useChatContext } from '../../context/ChatContext';

const COLUMNS = [
  { key: 'jobName',  label: 'Job Name' },
  { key: 'employer', label: 'Employer' },
  { key: 'duration', label: 'Job Duration', defaultVisible: false },
  { key: 'status',   label: 'Status' },
  { key: 'earned',   label: 'Earned' },
  { key: 'actions',  label: 'Actions' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'earned-high', label: 'Earned (High to Low)' },
  { value: 'earned-low', label: 'Earned (Low to High)' },
];


export default function FreelancerJobHistory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();
  const jobs = useSelector(selectJobHistory);
  const jobHistoryMeta = useSelector(selectJobHistoryMeta);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const feedbackEligibilityMap = useSelector((state) => state.feedback.eligibilityByJob || {});

  const [feedbackModal, setFeedbackModal] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [columnFilters, setColumnFilters] = useState({ status: [], employer: [], jobName: [] });
  const setColFilter = (field) => (values) => setColumnFilters(prev => ({ ...prev, [field]: values }));

  const cols = useSmartColumnToggle(COLUMNS, 'job-history-cols');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const querySignature = JSON.stringify({
    debouncedSearchTerm,
    sortBy,
    statusIn: columnFilters.status,
    employerIn: columnFilters.employer,
    jobTitleIn: columnFilters.jobName,
    page: currentPage,
    limit: pageSize,
  });

  useEffect(() => {
    dispatch(
      loadJobHistory({
        search: debouncedSearchTerm,
        sortBy,
        statusIn: columnFilters.status,
        employerIn: columnFilters.employer,
        jobTitleIn: columnFilters.jobName,
        page: currentPage,
        limit: pageSize,
      }),
    );
  }, [dispatch, querySignature]);

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
    return [...(jobs || [])];
  }, [jobs]);

  const hasActiveFilters =
    debouncedSearchTerm ||
    columnFilters.status.length > 0 ||
    columnFilters.employer.length > 0 ||
    columnFilters.jobName.length > 0;

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
      <p className="text-gray-500 mt-0 sm:-mt-6 mb-6 text-sm sm:text-base">View your completed and past jobs</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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

      {/* Search + Sort + Columns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <SmartSearchInput
              value={searchTerm}
              onChange={(value) => {
                setCurrentPage(1);
                setSearchTerm(value);
              }}
              dataSource={jobs || []}
              getSearchValue={(item) => item.title || ''}
              placeholder="Search by job title, company, or skills..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              setCurrentPage(1);
              setSortBy(e.target.value);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <SmartColumnToggle columns={COLUMNS} visible={cols.visible} onChange={cols.setVisible} storageKey="job-history-cols" />
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
            <button
              onClick={() =>
                dispatch(
                  loadJobHistory({
                    search: debouncedSearchTerm,
                    sortBy,
                    statusIn: columnFilters.status,
                    employerIn: columnFilters.employer,
                    jobTitleIn: columnFilters.jobName,
                    page: currentPage,
                    limit: pageSize,
                  }),
                )
              }
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (!jobs || jobs.length === 0) ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <p className="text-gray-800 font-medium mb-1">{hasActiveFilters ? 'No matching jobs' : 'No job history'}</p>
            <p className="text-gray-500 text-sm">{hasActiveFilters ? 'Try adjusting your search or filters' : "You haven't completed any jobs yet."}</p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setSearchTerm('');
                  setSortBy('newest');
                  setColumnFilters({ status: [], employer: [], jobName: [] });
                }}
                className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                  {cols.visible.has('jobName')  && (
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        Job Name
                        <SmartFilter
                          label="Job"
                          data={jobs || []}
                          field="title"
                          selectedValues={columnFilters.jobName}
                          onFilterChange={(values) => {
                            setCurrentPage(1);
                            setColFilter('jobName')(values);
                          }}
                          options={jobHistoryMeta?.filterOptions?.jobTitles || []}
                        />
                      </div>
                    </th>
                  )}
                  {cols.visible.has('employer') && (
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        Employer
                        <SmartFilter
                          label="Employer"
                          data={jobs || []}
                          field="company"
                          selectedValues={columnFilters.employer}
                          onFilterChange={(values) => {
                            setCurrentPage(1);
                            setColFilter('employer')(values);
                          }}
                          options={jobHistoryMeta?.filterOptions?.employers || []}
                        />
                      </div>
                    </th>
                  )}
                  {cols.visible.has('duration') && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Job Duration</th>}
                  {cols.visible.has('status')   && (
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1.5">
                        Status
                        <SmartFilter
                          label="Status"
                          data={jobs || []}
                          field="status"
                          selectedValues={columnFilters.status}
                          onFilterChange={(values) => {
                            setCurrentPage(1);
                            setColFilter('status')(values);
                          }}
                          options={jobHistoryMeta?.filterOptions?.statuses || []}
                          valueFormatter={(v) => v === 'finished' ? 'Completed' : v === 'left' ? 'Left' : v}
                        />
                      </div>
                    </th>
                  )}
                  {cols.visible.has('earned')   && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Earned</th>}
                  {cols.visible.has('actions')  && <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedJobs.map((job) => {
                  const jobId = job._id || job.id;
                  const eligibility = feedbackEligibilityMap[jobId];
                  return (
                    <tr key={jobId} className="hover:bg-gray-50 transition-colors">
                      {cols.visible.has('jobName') && (
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900">{job.title || 'N/A'}</p>
                        </td>
                      )}
                      {cols.visible.has('employer') && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img src={job.logo || '/assets/company_logo.jpg'} alt={job.company} className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0" onError={(e) => { e.target.src = '/assets/company_logo.jpg'; }} />
                            <p className="text-sm text-gray-700 font-medium truncate">{job.company || 'N/A'}</p>
                          </div>
                        </td>
                      )}
                      {cols.visible.has('duration') && (
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs text-gray-600">{job.date || 'N/A'}</span>
                          {job.cancelReason && <p className="text-[11px] text-red-500 mt-0.5">{job.cancelReason}</p>}
                        </td>
                      )}
                      {cols.visible.has('status') && (
                        <td className="px-5 py-4 text-center">{getStatusBadge(job.status)}</td>
                      )}
                      {cols.visible.has('earned') && (
                        <td className="px-5 py-4 text-center">
                          {job.paidAmount > 0 ? (
                            <span className="text-sm font-semibold text-gray-800">{'₹'}{(job.paidAmount || 0).toLocaleString()}</span>
                          ) : (
                            <span className="text-xs text-gray-400">Not paid</span>
                          )}
                          {job.totalBudget > 0 && (
                            <p className="text-[10px] text-gray-400">of {'₹'}{job.totalBudget.toLocaleString()}</p>
                          )}
                        </td>
                      )}
                      {cols.visible.has('actions') && (
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              Details
                            </button>
                            <button onClick={() => handleChat(job)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-500 text-white rounded-lg text-xs font-medium hover:bg-sky-600 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                              Chat
                            </button>
                            {eligibility?.canGiveFeedback && (
                              <button
                                onClick={() => setFeedbackModal({ jobId, toUserId: eligibility.counterparty.userId, toRole: eligibility.counterparty.role, counterpartyName: eligibility.counterparty.name })}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
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
            {!loading && processedJobs.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400">Showing {processedJobs.length} of {jobHistoryMeta?.total ?? jobs.length} job{(jobHistoryMeta?.total ?? jobs.length) !== 1 ? 's' : ''}</p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Rows:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setCurrentPage(1);
                        setPageSize(Math.min(100, Math.max(1, Number(e.target.value) || 25)));
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    {Number(jobHistoryMeta?.pagination?.totalPages || 1) > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={loading || !jobHistoryMeta?.pagination?.hasPrevPage}
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={loading || !jobHistoryMeta?.pagination?.hasNextPage}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                        >
                          Next
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackForm
        isOpen={!!feedbackModal}
        jobId={feedbackModal?.jobId}
        toUserId={feedbackModal?.toUserId}
        toRole={feedbackModal?.toRole}
        counterpartyName={feedbackModal?.counterpartyName}
        onSuccess={() => { setFeedbackModal(null); dispatch(checkCanGiveFeedback(feedbackModal?.jobId)); }}
        onCancel={() => setFeedbackModal(null)}
      />

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={selectedJob}
          onJobLeft={() =>
            dispatch(
              loadJobHistory({
                search: debouncedSearchTerm,
                sortBy,
                statusIn: columnFilters.status,
                employerIn: columnFilters.employer,
                jobTitleIn: columnFilters.jobName,
                page: currentPage,
                limit: pageSize,
              }),
            )
          }
          showLeaveButton={false}
        />
      )}
    </DashboardPage>
  );
}
