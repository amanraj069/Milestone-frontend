import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';
import RatingHistoryModal from '../../components/RatingHistoryModal';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

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
    if (!complaint?.complainantUserId) return;
    openChatWith(complaint.complainantUserId);
  };

  // Inline rating adjustment
  const openRatingAdjust = (userType) => {
    setRatingTarget(userType);
    // Pre-populate if there's already a pending rating for this user
    const pending = pendingRatings[type];
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
    const isExpanded = ratingTarget === type;
    const pendingRating = pendingRatings[type];
    const isComplaintClosed = complaint && (complaint.status === 'Resolved' || complaint.status === 'Rejected');

    // Calculate what the rating will be after pending adjustment
    const displayRating = pendingRating 
      ? Math.max(1.0, Math.min(5.0, Math.round(((rating || 4.5) + pendingRating.adjustment) * 10) / 10))
      : rating;

    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">{name}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>{badgeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingRating && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {pendingRating.adjustment > 0 ? '+' : ''}{pendingRating.adjustment.toFixed(1)} pending
              </span>
            )}
            <span className="text-sm font-bold text-amber-500">
              {displayRating?.toFixed(1) || 'N/A'} <span className="text-amber-400">&#9733;</span>
            </span>
          </div>
        </div>

        {!isExpanded && !isComplaintClosed ? (
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => openRatingAdjust(type)}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              {pendingRating ? 'Modify Adjustment' : 'Adjust Rating'}
            </button>
            {pendingRating && (
              <button
                type="button"
                onClick={() => setPendingRatings(prev => ({ ...prev, [type]: null }))}
                className="px-3 py-1.5 bg-white text-red-600 border border-red-300 rounded-md text-xs font-medium hover:bg-red-50 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => handleViewHistory(type)}
              className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              History
            </button>
          </div>
        ) : isComplaintClosed ? (
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => handleViewHistory(type)}
              className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              History
            </button>
            <span className="text-xs text-gray-500 self-center">Rating adjustment disabled (complaint closed)</span>
          </div>
        ) : isExpanded ? (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
            {/* +/- Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustment > -4.0 && setAdjustment(Math.round((adjustment - 0.1) * 10) / 10)}
                disabled={adjustment <= -4.0 || newRating <= 1.0}
                className={`w-8 h-8 rounded-md font-bold text-sm ${
                  adjustment <= -4.0 || newRating <= 1.0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >−</button>
              <div className="text-center flex-1">
                <span className={`text-xl font-bold ${adjustment < 0 ? 'text-red-600' : adjustment > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {adjustment > 0 ? '+' : ''}{adjustment.toFixed(1)}
                </span>
                <span className="text-gray-400 mx-2">&rarr;</span>
                <span className="text-xl font-bold text-gray-900">{newRating.toFixed(1)}</span>
                <span className="text-amber-400 ml-0.5">&#9733;</span>
              </div>
              <button
                type="button"
                onClick={() => adjustment < 0.5 && newRating < 5.0 && setAdjustment(Math.round((adjustment + 0.1) * 10) / 10)}
                disabled={adjustment >= 0.5 || newRating >= 5.0}
                className={`w-8 h-8 rounded-md font-bold text-sm ${
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="text-[11px] text-gray-400">{ratingReason.length}/500</div>

            {ratingError && <p className="text-xs text-red-600">{ratingError}</p>}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRatingStage}
                disabled={adjustment === 0 || ratingReason.trim().length < 20}
                className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Stage Adjustment
              </button>
              <button
                type="button"
                onClick={closeRatingAdjust}
                className="px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const content = (
    <div className="max-w-4xl mx-auto space-y-4">

      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
          <p className="mt-3 text-gray-500 text-sm">Loading complaint details...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
          <i className="fas fa-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {!loading && !error && complaint && (
        <>
          {/* Top row: Back + Status */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/moderator/complaints')}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <i className="fas fa-arrow-left text-xs"></i> Back to Complaints
            </button>
            <span className={`px-2.5 py-1 rounded text-xs font-medium ${getStatusStyle(complaint.status)}`}>
              {complaint.status}
            </span>
          </div>

          {/* Complaint Info */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{complaint.subject}</h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                <span>{complaint.complaintType}</span>
                <span>&bull;</span>
                <span className={`px-1.5 py-0.5 rounded font-medium ${getPriorityStyle(complaint.priority)}`}>{complaint.priority}</span>
                <span>&bull;</span>
                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400 text-xs">Filed By</span>
                  <p className="text-gray-900 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mr-1.5 ${
                      complaint.complainantType === 'Freelancer' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'
                    }`}>{complaint.complainantType}</span>
                    {complaint.complainantName}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Job</span>
                  <p className="text-gray-900 mt-0.5">{complaint.jobTitle}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Freelancer</span>
                  <p className="text-gray-900 mt-0.5">{complaint.freelancerName}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Employer</span>
                  <p className="text-gray-900 mt-0.5">{complaint.employerName}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <span className="text-gray-400 text-xs">Description</span>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
              </div>
            </div>
          </div>

          {/* Rating Management */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900">Rating Management</h4>
            </div>
            <div className="px-5 py-4">
              <div className="flex flex-col md:flex-row gap-4">
                {renderRatingUser(
                  'freelancer',
                  complaint.freelancerName,
                  complaint.freelancerRating,
                  'bg-cyan-100 text-cyan-700',
                  'Freelancer'
                )}
                <div className="hidden md:block w-px bg-gray-200"></div>
                <div className="md:hidden h-px bg-gray-200"></div>
                {renderRatingUser(
                  'employer',
                  complaint.employerName,
                  complaint.employerRating,
                  'bg-amber-100 text-amber-700',
                  'Employer'
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 space-y-3">
            <textarea
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              placeholder="Add notes about your decision (optional)..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleChat}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <i className="fas fa-comment text-xs"></i> Chat with Complainant
              </button>
              <div className="flex-1"></div>
              {(pendingRatings.freelancer || pendingRatings.employer) && complaint.status !== 'Resolved' && complaint.status !== 'Rejected' && (
                <span className="text-xs text-blue-600 font-medium">
                  {[
                    pendingRatings.freelancer && `Freelancer ${pendingRatings.freelancer.adjustment > 0 ? '+' : ''}${pendingRatings.freelancer.adjustment.toFixed(1)}`,
                    pendingRatings.employer && `Employer ${pendingRatings.employer.adjustment > 0 ? '+' : ''}${pendingRatings.employer.adjustment.toFixed(1)}`
                  ].filter(Boolean).join(', ')} will be applied
                </span>
              )}
              <button
                type="button"
                onClick={() => handleUpdateStatus('Resolved')}
                disabled={updating || complaint.status === 'Resolved' || complaint.status === 'Rejected'}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? <i className="fas fa-spinner fa-spin"></i> : 'Resolve'}
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Rejected')}
                disabled={updating || complaint.status === 'Rejected' || complaint.status === 'Resolved'}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
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
