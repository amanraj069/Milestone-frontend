import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { graphqlRequest } from '../../utils/graphqlClient';

const ApplicationDetailsModal = ({ application, onClose }) => {
  const navigate = useNavigate();
  const [closing, setClosing] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState('');
  const [applicationDetails, setApplicationDetails] = useState(null);

  useEffect(() => {
    // disable scrolling on body while modal open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!application?.applicationId) {
        setDetailsLoading(false);
        return;
      }

      try {
        setDetailsLoading(true);
        setDetailsError('');
        const data = await graphqlRequest({
          query: `
            query EmployerApplicationDetail($applicationId: String!) {
              employerApplicationDetail(applicationId: $applicationId) {
                applicationId
                jobId
                freelancerId
                freelancerUserId
                status
                appliedDate
                coverMessage
                resumeLink
                freelancerName
                freelancerPicture
                freelancerEmail
                freelancerPhone
                freelancerRating
                skillRating
                isPremium
                freelancerAbout
                freelancerSkills
                freelancerPortfolio {
                  title
                  description
                  image
                  link
                }
                jobTitle
                jobDescription {
                  text
                  responsibilities
                  requirements
                  skills
                }
                feedbackReviews {
                  feedbackId
                  fromUserName
                  fromUserPicture
                  rating
                  comment
                  tags
                  createdAt
                }
                feedbackTotal
                jobMatch {
                  matchScore
                  matchedSkills
                  missingSkills
                  hasPortfolio
                  hasResume
                  feedbackCount
                  averageFeedbackRating
                }
              }
            }
          `,
          variables: { applicationId: application.applicationId },
        });

        setApplicationDetails(data?.employerApplicationDetail || null);
      } catch (error) {
        console.error('Error loading application details:', error);
        setDetailsError('Failed to load enriched application details');
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [application?.applicationId]);

  const detail = applicationDetails || application;
  const feedbacks = applicationDetails?.feedbackReviews || [];
  const portfolio = applicationDetails?.freelancerPortfolio || [];
  const skills = applicationDetails?.freelancerSkills || [];
  const jobMatch = applicationDetails?.jobMatch;

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const startClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose && onClose();
    }, 200);
  };

  const handleViewProfile = () => {
    const profileId = detail.freelancerUserId || detail.freelancerId;
    navigate(`/freelancer/${profileId}`);
  };

  const handleViewJob = () => {
    navigate(`/jobs/${detail.jobId}`);
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm z-[60] transition-opacity duration-220 ${
        closing ? 'animate-[appOverlayOut_180ms_ease-in_forwards]' : 'animate-[appOverlayIn_220ms_ease-out_forwards]'
      }`}
      onClick={startClose}
      style={{
        opacity: closing ? undefined : 0,
      }}
    >
      <div
        className={`w-full max-w-3xl max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-2xl transition-all duration-260 ${
          closing ? 'animate-[appPanelOut_180ms_ease-in_forwards]' : 'animate-[appPanelIn_260ms_ease-out_forwards]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: closing ? undefined : 'translateY(10px) scale(0.995)',
          opacity: closing ? undefined : 0,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <img
              src={detail.freelancerPicture || '/default-avatar.png'}
              alt={detail.freelancerName}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{detail.freelancerName || 'Unknown Applicant'}</h2>
              <p className="text-sm text-gray-500">Candidate Application Details</p>
            </div>
          </div>
          <button 
            onClick={startClose} 
            className="bg-transparent border-none text-gray-600 cursor-pointer p-1.5 rounded-full transition-colors hover:bg-black/6"
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Job Role Applied For */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-600 mb-1 block">
                  <i className="fas fa-briefcase mr-2 text-blue-600"></i>
                  Job Role Applied For
                </label>
                <p className="text-lg font-medium text-gray-800">{detail.jobTitle}</p>
              </div>
              <button
                onClick={handleViewJob}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap ml-4"
              >
                <i className="fas fa-external-link-alt mr-2"></i>
                View Job
              </button>
            </div>
          </div>

          {/* Cover Message */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-600 mb-2 block">
              <i className="fas fa-envelope mr-2 text-blue-600"></i>
              Cover Message
            </label>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
              <p className="text-gray-700 whitespace-pre-wrap">
                {detail.coverMessage || 'No cover message provided.'}
              </p>
            </div>
          </div>

          {applicationDetails?.jobDescription?.text && (
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                <i className="fas fa-file-alt mr-2 text-blue-600"></i>
                Job Description Snapshot
              </label>
              <p className="text-gray-700 whitespace-pre-wrap">
                {applicationDetails.jobDescription.text}
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                <i className="fas fa-envelope mr-2 text-blue-600"></i>
                Email Address
              </label>
              <p className="text-gray-800 font-medium">
                {detail.freelancerEmail || 'Not provided'}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                <i className="fas fa-phone mr-2 text-blue-600"></i>
                Phone Number
              </label>
              <p className="text-gray-800 font-medium">
                {detail.freelancerPhone || 'Not provided'}
              </p>
            </div>
          </div>

          {applicationDetails?.freelancerAbout && (
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                <i className="fas fa-user mr-2 text-blue-600"></i>
                Freelancer Profile Summary
              </label>
              <p className="text-gray-700 whitespace-pre-wrap">{applicationDetails.freelancerAbout}</p>
            </div>
          )}

          {skills.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600 mb-3 block">
                <i className="fas fa-tools mr-2 text-blue-600"></i>
                Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span key={`${skill}-${idx}`} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {jobMatch && (
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600 mb-3 block">
                <i className="fas fa-bullseye mr-2 text-blue-600"></i>
                Job Match Signals
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-gray-500">Match Score</p>
                  <p className="text-xl font-bold text-blue-700">{jobMatch.matchScore}%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <p className="text-xs text-gray-500">Feedback Rating</p>
                  <p className="text-xl font-bold text-green-700">{jobMatch.averageFeedbackRating || 0} / 5</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-xs text-gray-500">Feedback Count</p>
                  <p className="text-xl font-bold text-amber-700">{jobMatch.feedbackCount}</p>
                </div>
              </div>

              {jobMatch.matchedSkills?.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Matched Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {jobMatch.matchedSkills.map((skill, idx) => (
                      <span key={`matched-${skill}-${idx}`} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {jobMatch.missingSkills?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {jobMatch.missingSkills.map((skill, idx) => (
                      <span key={`missing-${skill}-${idx}`} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {portfolio.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600 mb-3 block">
                <i className="fas fa-images mr-2 text-blue-600"></i>
                Portfolio Highlights
              </label>
              <div className="space-y-3">
                {portfolio.slice(0, 4).map((item, idx) => (
                  <div key={`${item.title || 'portfolio'}-${idx}`} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <p className="font-medium text-gray-800">{item.title || 'Project'}</p>
                    {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 inline-block mt-2">
                        View Project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailsError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {detailsError}
            </div>
          )}

          {/* Application Status */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-600 mb-2 block">
              <i className="fas fa-info-circle mr-2 text-blue-600"></i>
              Application Status
            </label>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                detail.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                detail.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {detail.status}
              </span>
              <span className="text-gray-600 text-sm">
                Applied on {formatDate(detail.appliedDate)}
              </span>
            </div>
          </div>

          {/* Freelancer Feedback */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-600 mb-4 block">
              <i className="fas fa-comments mr-2 text-blue-600"></i>
              Freelancer Feedback & Reviews
            </label>
            {detailsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading feedback...</p>
              </div>
            ) : feedbacks.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedbacks.slice(0, 5).map((feedback, index) => (
                  <div key={feedback.feedbackId || index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                          {feedback.fromUserName ? feedback.fromUserName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {feedback.fromUserName || 'Anonymous'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(feedback.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`fas fa-star text-sm ${
                              star <= (feedback.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          ></i>
                        ))}
                        <span className="text-xs text-gray-600 ml-1">({feedback.rating || 0}/5)</span>
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">{feedback.comment}</p>
                    )}
                    {feedback.tags && feedback.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {feedback.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(applicationDetails?.feedbackTotal || feedbacks.length) > 5 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-600">
                      Showing 5 of {applicationDetails.feedbackTotal} reviews
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <i className="fas fa-comments text-3xl text-gray-300 mb-2"></i>
                <p className="text-gray-500 text-sm">No feedback available yet</p>
              </div>
            )}
          </div>

          {/* Skill Rating */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-600 mb-3 block">
              <i className="fas fa-star mr-2 text-blue-600"></i>
              Skill Rating
            </label>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`fas fa-star text-2xl ${
                      star <= (detail.skillRating || detail.freelancerRating || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  ></i>
                ))}
              </div>
              <span className="text-gray-700 font-medium ml-2">
                {detail.skillRating || detail.freelancerRating || 'N/A'} / 5
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleViewProfile}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
            >
              <i className="fas fa-user mr-2"></i>
              View Full Profile
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>

        {/* Keyframe animations for modal */}
        <style>{`
          @keyframes appOverlayIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes appOverlayOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes appPanelIn {
            from {
              transform: translateY(12px) scale(0.995);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          @keyframes appPanelOut {
            from {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            to {
              transform: translateY(12px) scale(0.995);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ApplicationDetailsModal;
