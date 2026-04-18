import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';
import RatingHistoryModal from '../../components/RatingHistoryModal';
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const API_BASE_URL = getBackendBaseUrl();

const ComplaintDetail = () => {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Inline rating adjustment state
  const [ratingTarget, setRatingTarget] = useState(null); // 'freelancer' | 'employer' | null
  const [adjustment, setAdjustment] = useState(0);
  const [ratingReason, setRatingReason] = useState('');
  const [ratingError, setRatingError] = useState('');

  // Pending rating adjustments (staged until complaint is resolved)
  const [pendingRatings, setPendingRatings] = useState({
    freelancer: null, // { adjustment, reason } or null
    employer: null
  });

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchComplaintDetail();
  }, [complaintId]);

  const fetchComplaintDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/moderator/complaints`,
        { withCredentials: true }
      );

      if (response.data.success) {
        const foundComplaint = response.data.complaints.find(
          c => c.complaintId === complaintId
        );
        if (foundComplaint) {
          setComplaint(foundComplaint);
          setModeratorNotes(foundComplaint.moderatorNotes || '');
        } else {
          setError('Complaint not found');
        }
      }
    } catch (err) {
      console.error('Error fetching complaint:', err);
      setError('Failed to load complaint details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!complaint) return;
    setUpdating(true);
    setSuccessMessage('');
    setError('');

    try {
      // If resolving and there are pending ratings, apply them first
      if (status === 'Resolved') {
        const ratingPromises = [];
        let appliedRatings = [];

        // Apply freelancer rating if pending
        if (pendingRatings.freelancer) {
          const promise = fetch(
            `${API_BASE_URL}/api/moderator/users/${complaint.freelancerUserId}/rating`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                adjustment: pendingRatings.freelancer.adjustment,
                reason: pendingRatings.freelancer.reason,
                complaintId: complaint.complaintId
              }),
            }
          ).then(r => r.json());
          ratingPromises.push(promise);
          appliedRatings.push(`freelancer ${pendingRatings.freelancer.adjustment > 0 ? '+' : ''}${pendingRatings.freelancer.adjustment}`);
        }

        // Apply employer rating if pending
        if (pendingRatings.employer) {
          const promise = fetch(
            `${API_BASE_URL}/api/moderator/users/${complaint.employerUserId}/rating`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                adjustment: pendingRatings.employer.adjustment,
                reason: pendingRatings.employer.reason,
                complaintId: complaint.complaintId
              }),
            }
          ).then(r => r.json());
          ratingPromises.push(promise);
          appliedRatings.push(`employer ${pendingRatings.employer.adjustment > 0 ? '+' : ''}${pendingRatings.employer.adjustment}`);
        }

        // Wait for all rating adjustments to complete
        if (ratingPromises.length > 0) {
          const results = await Promise.all(ratingPromises);
          const failedRatings = results.filter(r => !r.success);
          if (failedRatings.length > 0) {
            setError('Failed to apply some rating adjustments. Please try again.');
            setUpdating(false);
            return;
          }
        }

        // Clear pending ratings after applying
        setPendingRatings({ freelancer: null, employer: null });

        // Show what ratings were applied
        if (appliedRatings.length > 0) {
          setSuccessMessage(`Complaint resolved with rating adjustments: ${appliedRatings.join(', ')}`);
        } else {
          setSuccessMessage(`Status updated to ${status}`);
        }
      } else if (status === 'Rejected') {
        // Clear pending ratings when rejecting (they won't be applied)
        setPendingRatings({ freelancer: null, employer: null });
      }

      // Update complaint status
      const response = await axios.put(
        `${API_BASE_URL}/api/moderator/complaints/${complaint.complaintId}`,
        { status, moderatorNotes },
        { withCredentials: true }
      );
      if (response.data.success) {
        setComplaint(response.data.complaint);
        if (status !== 'Resolved') {
          setSuccessMessage(`Status updated to ${status}`);
        }
      }
    } catch (err) {
      console.error('Error updating complaint:', err);
      setError('Failed to update complaint status');
    } finally {
      setUpdating(false);
    }
  };

  const handleChat = () => {
    const targetUserId =
      complaint?.complainantUserId ||
      (complaint?.complainantType === 'Freelancer' ? complaint?.freelancerUserId : complaint?.employerUserId) ||
      complaint?.freelancerUserId ||
      complaint?.employerUserId;
    if (!targetUserId) {
      setError('Unable to start chat. Complainant user not found.');
      return;
    }
    openChatWith(targetUserId);
    navigate('/moderator/chat');
  };

  // Inline rating adjustment
  const openRatingAdjust = (userType) => {
    setRatingTarget(userType);
    // Pre-populate if there's already a pending rating for this user
    const pending = pendingRatings[userType];
    if (pending) {
      setAdjustment(pending.adjustment);
      setRatingReason(pending.reason);
    } else {
      setAdjustment(0);
      setRatingReason('');
    }
    setRatingError('');
  };

  const closeRatingAdjust = () => {
    setRatingTarget(null);
    setAdjustment(0);
    setRatingReason('');
    setRatingError('');
  };

  const handleRatingStage = () => {
    if (ratingReason.trim().length < 20) {
      setRatingError('Reason must be at least 20 characters');
      return;
    }
    if (adjustment === 0) {
      setRatingError('Adjustment cannot be zero');
      return;
    }

    // Stage the rating adjustment (don't submit yet)
    setPendingRatings(prev => ({
      ...prev,
      [ratingTarget]: { adjustment, reason: ratingReason.trim() }
    }));

    closeRatingAdjust();
    setSuccessMessage(`Rating adjustment staged for ${ratingTarget === 'freelancer' ? complaint.freelancerName : complaint.employerName}. Click "Resolve" to apply.`);
  };

  const handleViewHistory = (userType) => {
    setSelectedUser({
      userId: userType === 'freelancer' ? complaint.freelancerUserId : complaint.employerUserId,
      name: userType === 'freelancer' ? complaint.freelancerName : complaint.employerName
    });
    setShowHistoryModal(true);
  };

  const getStatusStyle = (status) => {
    const map = {
      'Pending': 'bg-amber-100 text-amber-700',
      'Under Review': 'bg-blue-100 text-blue-700',
      'Resolved': 'bg-green-100 text-green-700',
      'Rejected': 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityStyle = (priority) => {
    const map = {
      'Low': 'bg-blue-100 text-blue-700',
      'Medium': 'bg-amber-100 text-amber-700',
      'High': 'bg-red-100 text-red-700',
      'Critical': 'bg-red-200 text-red-800',
    };
    return map[priority] || 'bg-gray-100 text-gray-700';
  };

  const getCurrentRating = () => {
    if (!ratingTarget || !complaint) return 0;
    return ratingTarget === 'freelancer'
      ? (complaint.freelancerRating || 4.5)
      : (complaint.employerRating || 4.5);
  };

  const newRating = Math.max(1.0, Math.min(5.0, Math.round((getCurrentRating() + adjustment) * 10) / 10));

  // Render inline rating adjuster for a user
  const renderRatingUser = (type, name, rating, badgeClass, badgeLabel) => {
    const pendingRating = pendingRatings[type];
    const isComplaintClosed = complaint && (complaint.status === 'Resolved' || complaint.status === 'Rejected');

    // Calculate what the rating will be after pending adjustment
    const displayRating = pendingRating 
      ? Math.max(1.0, Math.min(5.0, Math.round(((rating || 4.5) + pendingRating.adjustment) * 10) / 10))
      : rating;

    return (
      <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
        {/* Row 1: User identity */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h5 className="font-semibold text-gray-900 text-base truncate" title={name}>{name}</h5>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>{badgeLabel}</span>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-2xl font-bold text-amber-500 leading-none">
              {displayRating?.toFixed(1) || 'N/A'} <span className="text-amber-400 text-lg">&#9733;</span>
            </span>
            {pendingRating && (
              <span className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                pendingRating.adjustment > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {pendingRating.adjustment > 0 ? '+' : ''}{pendingRating.adjustment.toFixed(1)} pending
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Action buttons */}
        {!isComplaintClosed && (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
            <button
              type="button"
              onClick={() => openRatingAdjust(type)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                ratingTarget === type
                  ? 'bg-gray-400 text-white hover:bg-gray-400'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {ratingTarget === type ? 'Adjust' : pendingRating ? 'Modify' : 'Adjust'}
            </button>
            {pendingRating && (
              <button
                type="button"
                onClick={() => setPendingRatings(prev => ({ ...prev, [type]: null }))}
                className="px-3 py-1.5 bg-white text-red-600 border border-red-300 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => handleViewHistory(type)}
              className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              History
            </button>
          </div>
        )}
        {isComplaintClosed && (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleViewHistory(type)}
              className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              History
            </button>
            <span className="text-sm text-gray-400 italic">Closed</span>
          </div>
        )}
      </div>
    );
  };

  // Render the expanded adjustment panel (full-width, below the cards)
  const renderAdjustmentPanel = () => {
    if (!ratingTarget) return null;
    const targetName = ratingTarget === 'freelancer' ? complaint.freelancerName : complaint.employerName;
    const targetBadge = ratingTarget === 'freelancer' ? 'Freelancer' : 'Employer';

    return (
      <div className="bg-white border border-blue-200 rounded-lg p-5 space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Adjusting rating for</span>
            <span className="font-bold text-gray-900">{targetName}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              ratingTarget === 'freelancer' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'
            }`}>{targetBadge}</span>
          </div>
          <button
            type="button"
            onClick={closeRatingAdjust}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* +/- Controls */}
        <div className="flex items-center gap-4 justify-center py-2">
          <button
            type="button"
            onClick={() => adjustment > -4.0 && setAdjustment(Math.round((adjustment - 0.1) * 10) / 10)}
            disabled={adjustment <= -4.0 || newRating <= 1.0}
            className={`w-10 h-10 rounded-lg font-bold text-lg ${
              adjustment <= -4.0 || newRating <= 1.0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >−</button>
          <div className="text-center min-w-[160px]">
            <span className={`text-2xl font-bold ${adjustment < 0 ? 'text-red-600' : adjustment > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {adjustment > 0 ? '+' : ''}{adjustment.toFixed(1)}
            </span>
            <span className="text-gray-400 mx-3 text-lg">&rarr;</span>
            <span className="text-2xl font-bold text-gray-900">{newRating.toFixed(1)}</span>
            <span className="text-amber-400 ml-1 text-lg">&#9733;</span>
          </div>
          <button
            type="button"
            onClick={() => adjustment < 0.5 && newRating < 5.0 && setAdjustment(Math.round((adjustment + 0.1) * 10) / 10)}
            disabled={adjustment >= 0.5 || newRating >= 5.0}
            className={`w-10 h-10 rounded-lg font-bold text-lg ${
              adjustment >= 0.5 || newRating >= 5.0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >+</button>
        </div>

        {/* Reason */}
        <textarea
          value={ratingReason}
          onChange={(e) => setRatingReason(e.target.value)}
          placeholder="Reason for adjustment (min 20 characters)..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{ratingReason.length}/500</span>
          {ratingError && <p className="text-xs text-red-600">{ratingError}</p>}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRatingStage}
            disabled={adjustment === 0 || ratingReason.trim().length < 20}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Stage Adjustment
          </button>
          <button
            type="button"
            onClick={closeRatingAdjust}
            className="px-5 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const content = (
    <div className="space-y-6">

      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading complaint details...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 flex items-center gap-2">
          <i className="fas fa-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {!loading && !error && complaint && (
        <>
          {/* Top row: Back + Status */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate('/moderator/complaints')}
              className="flex items-center text-gray-500 hover:text-blue-600 transition-colors text-base"
            >
              &larr; Back to Complaints
            </button>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(complaint.status)}`}>
              {complaint.status}
            </span>
          </div>

          {/* Complaint Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">{complaint.subject}</h3>
              <div className="flex items-center gap-3 mt-2 text-base text-gray-500">
                <span>{complaint.complaintType}</span>
                <span className="text-gray-300">&bull;</span>
                <span className={`px-3 py-0.5 rounded-full text-sm font-medium ${getPriorityStyle(complaint.priority)}`}>{complaint.priority}</span>
                <span className="text-gray-300">&bull;</span>
                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5 text-base">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Filed By</p>
                  <p className="text-gray-900 font-medium">
                    <span className={`inline-block px-3 py-0.5 rounded-full text-sm font-medium mr-2 ${
                      complaint.complainantType === 'Freelancer' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'
                    }`}>{complaint.complainantType}</span>
                    {complaint.complainantName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Job</p>
                  <p className="text-gray-900 font-medium">{complaint.jobTitle}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Freelancer</p>
                  <p className="text-gray-900 font-medium">{complaint.freelancerName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Employer</p>
                  <p className="text-gray-900 font-medium">{complaint.employerName}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
              </div>
            </div>
          </div>

          {/* Rating Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800">Rating Management</h4>
              <p className="text-sm text-gray-500 mt-0.5">Stage adjustments, then resolve the complaint to apply them</p>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderRatingUser(
                  'freelancer',
                  complaint.freelancerName,
                  complaint.freelancerRating,
                  'bg-cyan-100 text-cyan-700',
                  'Freelancer'
                )}
                {renderRatingUser(
                  'employer',
                  complaint.employerName,
                  complaint.employerRating,
                  'bg-amber-100 text-amber-700',
                  'Employer'
                )}
              </div>
              {renderAdjustmentPanel()}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <textarea
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              placeholder="Add notes about your decision (optional)..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-400"
            />

            {/* Pending summary */}
            {(pendingRatings.freelancer || pendingRatings.employer) && complaint.status !== 'Resolved' && complaint.status !== 'Rejected' && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                <i className="fas fa-info-circle text-blue-500 text-sm"></i>
                <span className="text-sm text-blue-700 font-medium">
                  {[
                    pendingRatings.freelancer && `Freelancer ${pendingRatings.freelancer.adjustment > 0 ? '+' : ''}${pendingRatings.freelancer.adjustment.toFixed(1)}`,
                    pendingRatings.employer && `Employer ${pendingRatings.employer.adjustment > 0 ? '+' : ''}${pendingRatings.employer.adjustment.toFixed(1)}`
                  ].filter(Boolean).join(', ')} will be applied on resolve
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleChat}
                className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <i className="fas fa-comment text-sm"></i> Chat with Complainant
              </button>
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Resolved')}
                disabled={updating || complaint.status === 'Resolved' || complaint.status === 'Rejected'}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-base font-medium hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? <i className="fas fa-spinner fa-spin"></i> : 'Resolve'}
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Rejected')}
                disabled={updating || complaint.status === 'Rejected' || complaint.status === 'Resolved'}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-base font-medium hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? <i className="fas fa-spinner fa-spin"></i> : 'Reject'}
              </button>
            </div>
          </div>

          {/* Rating History Modal */}
          <RatingHistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            userId={selectedUser?.userId}
            userName={selectedUser?.name}
            apiBasePath="/api/moderator"
          />
        </>
      )}
    </div>
  );

  return <DashboardPage title="Complaint Details">{content}</DashboardPage>;
};

export default ComplaintDetail;
