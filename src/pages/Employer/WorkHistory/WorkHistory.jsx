import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../../components/DashboardPage';
import FeedbackForm from '../../../components/FeedbackForm';
import FreelancerCard from './FreelancerCard';
import SmartSearchInput from '../../../components/SmartSearchInput';
import axios from 'axios';
import { checkCanGiveFeedback } from '../../../redux/slices/feedbackSlice';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'date_desc',   label: 'Date (Newest First)' },
  { value: 'date_asc',    label: 'Date (Oldest First)' },
  { value: 'name_asc',    label: 'Name (A → Z)' },
  { value: 'name_desc',   label: 'Name (Z → A)' },
  { value: 'rating_desc', label: 'Rating (High → Low)' },
  { value: 'rating_asc',  label: 'Rating (Low → High)' },
];

const EmployerWorkHistory = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, avgDays: 0, successRate: 0 });
  const [loading, setLoading] = useState(true);

  // ── Search / sort / filter state ──────────────────────────────────────────
  const [searchTerm, setSearchTerm]     = useState('');
  const [sortBy, setSortBy]             = useState('date_desc');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'completed' | 'left'
  const [filterRating, setFilterRating] = useState('all'); // 'all' | '4' | '3' | '2'

  const [feedbackModal, setFeedbackModal] = useState(null);

  const navigate = useNavigate();
  const dispatch  = useDispatch();
  const feedbackEligibilityMap = useSelector((state) => state.feedback.eligibilityByJob || {});

  useEffect(() => { fetchWorkHistory(); }, []);

  // Dispatch eligibility checks whenever freelancers list loads
  useEffect(() => {
    if (freelancers?.length > 0) {
      freelancers.forEach(f => { if (f.jobId) dispatch(checkCanGiveFeedback(f.jobId)); });
    }
  }, [freelancers, dispatch]);

  // ── Derived list: filter + sort in one memo ───────────────────────────────
  const filteredFreelancers = useMemo(() => {
    let list = [...freelancers];

    // 1. Fuzzy text search (name or job title)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(f =>
        f.name?.toLowerCase().includes(q) ||
        f.jobTitle?.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    if (filterStatus !== 'all') {
      list = list.filter(f => f.status === filterStatus);
    }

    // 3. Minimum-rating filter
    if (filterRating !== 'all') {
      const min = parseFloat(filterRating);
      list = list.filter(f => (f.rating || 0) >= min);
    }

    // 4. Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':    return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':   return (b.name || '').localeCompare(a.name || '');
        case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
        case 'rating_asc':  return (a.rating || 0) - (b.rating || 0);
        case 'date_asc':    return new Date(a.completedDate || a.leftDate || 0) - new Date(b.completedDate || b.leftDate || 0);
        case 'date_desc':
        default:            return new Date(b.completedDate || b.leftDate || 0) - new Date(a.completedDate || a.leftDate || 0);
      }
    });

    return list;
  }, [freelancers, searchTerm, filterStatus, filterRating, sortBy]);

  const hasActiveFilters = filterStatus !== 'all' || filterRating !== 'all' || searchTerm.trim() !== '';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterRating('all');
    setSortBy('date_desc');
  };

  const fetchWorkHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/employer/work-history`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setFreelancers(response.data.data.freelancers);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching work history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveFeedback = (freelancer) => {
    const eligibility = feedbackEligibilityMap[freelancer.jobId];
    if (eligibility?.canGiveFeedback) {
      setFeedbackModal({
        jobId:             freelancer.jobId,
        toUserId:          eligibility.counterparty.userId,
        toRole:            eligibility.counterparty.role,
        counterpartyName:  eligibility.counterparty.name,
      });
    }
  };

  return (
    <DashboardPage title="Work History">
      <div className="space-y-6">
        {/* Header */}
        <p className="text-gray-600">View freelancers who have previously worked on your projects</p>

        {/* ── Toolbar: Search · Sort · Filter ── */}
        <div className="bg-white rounded-xl shadow-md px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* SmartSearchInput with fuzzy autocomplete */}
            <div className="flex-1 min-w-[220px] relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <SmartSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                dataSource={freelancers}
                getSearchValue={(f) => f.name || ''}
                placeholder="Search freelancers, projects..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <div className="relative shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none text-sm border border-gray-200 rounded-lg pl-4 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 cursor-pointer font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="left">Left Job</option>
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Rating filter */}
            <div className="relative shrink-0">
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="appearance-none text-sm border border-gray-200 rounded-lg pl-4 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 cursor-pointer font-medium"
              >
                <option value="all">All Ratings</option>
                <option value="4">≥ 4 Stars</option>
                <option value="3">≥ 3 Stars</option>
                <option value="2">≥ 2 Stars</option>
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Sort */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none text-sm border border-gray-200 rounded-lg pl-4 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 cursor-pointer font-medium"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Reset active filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition-colors whitespace-nowrap border border-red-200 hover:border-red-300 rounded-lg px-3 py-2.5"
              >
                <i className="fas fa-times text-xs"></i>
                Reset
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-900 font-bold leading-none">×</button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  Status: {filterStatus === 'completed' ? 'Completed' : 'Left Job'}
                  <button onClick={() => setFilterStatus('all')} className="ml-1 hover:text-green-900 font-bold leading-none">×</button>
                </span>
              )}
              {filterRating !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  Rating: ≥ {filterRating} Stars
                  <button onClick={() => setFilterRating('all')} className="ml-1 hover:text-yellow-900 font-bold leading-none">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <div className="px-1">
            <p className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-semibold text-gray-700">{filteredFreelancers.length}</span>
              {' '}of{' '}
              <span className="font-semibold text-gray-700">{freelancers.length}</span>
              {' '}freelancer{freelancers.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Freelancers List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading work history...</p>
            </div>
          ) : filteredFreelancers.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-history text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">
                {hasActiveFilters ? 'No freelancers match the current filters.' : 'No work history available.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-3 text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFreelancers.map((freelancer) => (
                <FreelancerCard
                  key={`${freelancer.freelancerId}-${freelancer.jobId}`}
                  freelancer={freelancer}
                  onLeaveFeedback={handleLeaveFeedback}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <FeedbackForm
              jobId={feedbackModal.jobId}
              toUserId={feedbackModal.toUserId}
              toRole={feedbackModal.toRole}
              counterpartyName={feedbackModal.counterpartyName}
              onSuccess={() => {
                setFeedbackModal(null);
                dispatch(checkCanGiveFeedback(feedbackModal.jobId));
              }}
              onCancel={() => setFeedbackModal(null)}
            />
          </div>
        </div>
      )}
    </DashboardPage>
  );
};

export default EmployerWorkHistory;
