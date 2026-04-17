import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';
import ApplicationDetailsModal from '../../../components/employer/ApplicationDetailsModal';
import SmartColumnToggle, { useSmartColumnToggle } from '../../../components/SmartColumnToggle';
import SmartFilter from '../../../components/SmartFilter';
import axios from 'axios';
import { graphqlRequest } from '../../../utils/graphqlClient';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const APP_COLUMNS = [
  { key: 'freelancer', label: 'Freelancer' },
  { key: 'job', label: 'Job Details' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Applied Date' },
  { key: 'rating', label: 'Rating', defaultVisible: false },
  { key: 'view', label: 'View' },
  { key: 'resume', label: 'Resume' },
  { key: 'actions', label: 'Actions' },
];

const mergeUniqueValues = (existing = [], incoming = []) => {
  const seen = new Set();
  const merged = [];

  [...existing, ...incoming].forEach((value) => {
    if (value === undefined || value === null || value === '') return;
    const key = String(value);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(value);
  });

  return merged;
};

const EmployerApplications = () => {
  const [searchParams] = useSearchParams();
  const jobIdFilter = searchParams.get('jobId');
  
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPagination, setServerPagination] = useState(null);
  const [metaFilters, setMetaFilters] = useState({ freelancers: [], jobs: [], statuses: ['Pending', 'Accepted', 'Rejected'], ratings: [] });

  const [freelancerFilters, setFreelancerFilters] = useState([]);
  const [jobFilters, setJobFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);
  const [ratingFilters, setRatingFilters] = useState([]);
  const [sortBy, setSortBy] = useState('date-desc');
  const inFlightRequestKeyRef = useRef('');

  const cols = useSmartColumnToggle(APP_COLUMNS, 'employer-apps-cols');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filterSignature = JSON.stringify({
    jobIdFilter,
    debouncedSearchTerm,
    sortBy,
    freelancerFilters,
    jobFilters,
    statusFilters,
    ratingFilters,
  });

  useEffect(() => {
    fetchApplications(currentPage, pageSize);
  }, [currentPage, pageSize, filterSignature]);

  const fetchApplications = async (page = currentPage, limit = pageSize) => {
    const effectiveJobFilters = jobIdFilter
      ? [jobIdFilter]
      : jobFilters;

    const variables = {
      status: 'all',
      sort:
        sortBy === 'date-desc'
          ? 'newest'
          : sortBy === 'date-asc'
          ? 'oldest'
          : sortBy === 'name-asc'
          ? 'name_asc'
          : sortBy === 'name-desc'
          ? 'name_desc'
          : sortBy === 'rating-desc'
          ? 'rating_desc'
          : 'premium_oldest',
      limit,
      offset: (page - 1) * limit,
      page,
      search: debouncedSearchTerm || null,
      freelancerIn: freelancerFilters.length ? freelancerFilters : null,
      jobIn: effectiveJobFilters.length ? effectiveJobFilters : null,
      statusIn: statusFilters.length ? statusFilters : null,
      ratingIn: ratingFilters.length ? ratingFilters.map((r) => Number(r)).filter((n) => Number.isFinite(n)) : null,
    };

    const requestKey = JSON.stringify(variables);
    if (inFlightRequestKeyRef.current === requestKey) {
      return;
    }

    try {
      setLoading(true);
      inFlightRequestKeyRef.current = requestKey;

      const data = await graphqlRequest({
        query: `
          query EmployerApplications(
            $status: String
            $sort: String
            $limit: Int
            $offset: Int
            $page: Int
            $search: String
            $freelancerIn: [String]
            $jobIn: [String]
            $statusIn: [String]
            $ratingIn: [Float]
          ) {
            employerApplications(
              status: $status
              sort: $sort
              limit: $limit
              offset: $offset
              page: $page
              search: $search
              freelancerIn: $freelancerIn
              jobIn: $jobIn
              statusIn: $statusIn
              ratingIn: $ratingIn
            ) {
              applications {
                applicationId
                jobId
                freelancerId
                status
                appliedDate
                coverMessage
                resumeLink
                freelancerUserId
                freelancerName
                freelancerPicture
                freelancerEmail
                freelancerPhone
                skillRating
                jobTitle
                isPremium
              }
              filterOptions {
                freelancers
                jobs
                statuses
                ratings
              }
              pagination {
                page
                limit
                total
                totalPages
                hasNextPage
                hasPrevPage
              }
              stats {
                total
                pending
                accepted
                rejected
              }
            }
          }
        `,
        variables,
      });

      const payload = data?.employerApplications;
      const rows = payload?.applications || [];
      setApplications(rows);
      setStats(payload?.stats || { total: 0, pending: 0, accepted: 0, rejected: 0 });
      setServerPagination(payload?.pagination || null);
      const incomingFilters = payload?.filterOptions || { freelancers: [], jobs: [], statuses: [], ratings: [] };

      setMetaFilters((prev) => {
        const mergedStatuses = mergeUniqueValues(
          prev.statuses,
          mergeUniqueValues(incomingFilters.statuses || [], ['Pending', 'Accepted', 'Rejected']),
        );

        return {
          freelancers: mergeUniqueValues(prev.freelancers, incomingFilters.freelancers || []),
          jobs: mergeUniqueValues(prev.jobs, incomingFilters.jobs || []),
          statuses: mergedStatuses,
          ratings: mergeUniqueValues(prev.ratings, incomingFilters.ratings || []),
        };
      });
      if (payload?.pagination?.page && payload.pagination.page !== currentPage) {
        setCurrentPage(payload.pagination.page);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      inFlightRequestKeyRef.current = '';
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  const handleAccept = async (applicationId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/employer/job_applications/${applicationId}/accept`, {}, { withCredentials: true });
      if (response.data.success) {
        fetchApplications(currentPage, pageSize);
      }
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Failed to accept application');
    }
  };

  const handleReject = async (applicationId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/employer/job_applications/${applicationId}/reject`, {}, { withCredentials: true });
      if (response.data.success) {
        fetchApplications(currentPage, pageSize);
      }
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

  const getStatusBadge = (status) => {
    const styles = {
      Pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'PENDING' },
      Accepted: { bg: 'bg-green-100', text: 'text-green-700', label: 'ACCEPTED' },
      Rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'REJECTED' },
    };
    const s = styles[status] || styles.Pending;
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const activeFilters =
    freelancerFilters.length +
    jobFilters.length +
    statusFilters.length +
    ratingFilters.length +
    (searchTerm ? 1 : 0);

  const filteredJobTitle =
    jobIdFilter && applications.length > 0 ? applications[0].jobTitle : null;

  return (
    <DashboardPage title={filteredJobTitle ? `Applications for ${filteredJobTitle}` : 'Applications'}>
      <div className="space-y-6">
        <p className="text-gray-600">Review and manage applications for your job listings</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-file-alt text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-clock text-amber-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Accepted</p>
                <p className="text-2xl font-bold text-gray-800">{stats.accepted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-times-circle text-red-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Rejected</p>
                <p className="text-2xl font-bold text-gray-800">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search by name, email, or job title..."
                value={searchTerm}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => {
                setCurrentPage(1);
                setSortBy(e.target.value);
              }}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="rating-desc">Highest Rated</option>
            </select>

            <SmartColumnToggle columns={APP_COLUMNS} visible={cols.visible} onChange={cols.setVisible} storageKey="employer-apps-cols" />

            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setSearchTerm('');
                  setFreelancerFilters([]);
                  setJobFilters([]);
                  setStatusFilters([]);
                  setRatingFilters([]);
                }}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {!hasLoadedOnce ? (
          <div className="bg-white rounded-xl shadow-md">
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading applications...</p>
            </div>
          </div>
        ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-600 font-medium">No applications found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    {cols.visible.has('freelancer') && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          Freelancer
                          <SmartFilter
                            label="Freelancer"
                            data={applications}
                            field="freelancerName"
                            selectedValues={freelancerFilters}
                            onFilterChange={(values) => {
                              setCurrentPage(1);
                              setFreelancerFilters(values);
                            }}
                            options={metaFilters.freelancers}
                          />
                        </div>
                      </th>
                    )}
                    {cols.visible.has('job') && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          Job Details
                          <SmartFilter
                            label="Job"
                            data={applications}
                            field="jobTitle"
                            selectedValues={jobFilters}
                            onFilterChange={(values) => {
                              setCurrentPage(1);
                              setJobFilters(values);
                            }}
                            options={metaFilters.jobs}
                          />
                        </div>
                      </th>
                    )}
                    {cols.visible.has('status') && (
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          Status
                          <SmartFilter
                            label="Status"
                            data={applications}
                            field="status"
                            selectedValues={statusFilters}
                            onFilterChange={(values) => {
                              setCurrentPage(1);
                              setStatusFilters(values);
                            }}
                            options={metaFilters.statuses}
                          />
                        </div>
                      </th>
                    )}
                    {cols.visible.has('date') && (
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Applied</th>
                    )}
                    {cols.visible.has('rating') && (
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          Rating
                          <SmartFilter
                            label="Rating"
                            data={applications}
                            field="skillRating"
                            selectedValues={ratingFilters}
                            onFilterChange={(values) => {
                              setCurrentPage(1);
                              setRatingFilters(values);
                            }}
                            options={metaFilters.ratings}
                          />
                        </div>
                      </th>
                    )}
                    {cols.visible.has('view') && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">View</th>}
                    {cols.visible.has('resume') && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Resume</th>}
                    {cols.visible.has('actions') && <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ width: '140px' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.map((application) => (
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
        )}

        {!loading && applications.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 mt-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Showing {applications.length} applications on page {serverPagination?.page || currentPage} (total {serverPagination?.total || applications.length})
              </div>
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
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={loading || !(serverPagination?.hasPrevPage || currentPage > 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={loading || !serverPagination?.hasNextPage}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDetailsModal && selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </DashboardPage>
  );
};

export default EmployerApplications;
export { EmployerApplications };
