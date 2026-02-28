//job history.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../components/DashboardPage';
import FeedbackForm from '../../components/FeedbackForm';
import JobDetailsModal from '../../components/freelancer/JobDetailsModal';
import { loadJobHistory, selectJobHistory, selectJobsLoading, selectJobsError } from '../../redux/slices/jobsSlice';
import { checkCanGiveFeedback, selectFeedbackEligibility } from '../../redux/slices/feedbackSlice';
import { useChatContext } from '../../context/ChatContext';

function Stars({ rating = 0 }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div className="flex gap-1">
      {[...Array(full)].map((_, i) => (
        <span key={`full-${i}`} className="text-amber-400 text-lg">★</span>
      ))}
      {half === 1 && <span className="text-amber-400 text-lg">½</span>}
      {[...Array(empty)].map((_, i) => (
        <span key={`empty-${i}`} className="text-slate-300 text-lg">☆</span>
      ))}
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

  useEffect(() => {
    console.log('JobHistory: Loading job history...');
    dispatch(loadJobHistory());
  }, [dispatch]);

  useEffect(() => {
    console.log('JobHistory state:', { jobs, loading, error });
  }, [jobs, loading, error]);

  // Check feedback eligibility for ALL jobs
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      jobs.forEach(job => {
        const jobId = job._id || job.id;
        dispatch(checkCanGiveFeedback(jobId));
      });
    }
  }, [jobs, dispatch]);

  const renderJobCard = (job) => {
    const isCompleted = job.status === 'finished';
    const isLeft = job.status === 'left';
    const isPaid = job.price && !String(job.price).toLowerCase().includes('not');
    const jobId = job._id || job.id;
    const eligibility = feedbackEligibilityMap[jobId];

    const handleLeaveFeedback = () => {
      if (eligibility?.canGiveFeedback) {
        setFeedbackModal({
          jobId,
          toUserId: eligibility.counterparty.userId,
          toRole: eligibility.counterparty.role,
          counterpartyName: eligibility.counterparty.name
        });
      }
    };

    const handleSeeMore = () => {
      setSelectedJob(job);
      setIsModalOpen(true);
    };

    const handleChat = () => {
      console.log('JobHistory - Chat clicked for job:', job);
      console.log('JobHistory - employerUserId:', job.employerUserId);
      console.log('JobHistory - job.employer:', job.employer);
      
      const employerUserId = job.employerUserId || job.employer?.userId || job.employerUser?.userId;
      console.log('JobHistory - resolved employerUserId:', employerUserId);
      
      if (!employerUserId) {
        console.error('JobHistory - No employerUserId found, job object:', job);
        alert('Unable to start chat: Employer information not available');
        return;
      }
      openChatWith(employerUserId);
    };

    return (
      <div key={jobId} className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
        <div className="p-4 flex items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
            <img
              src={job.logo || '/assets/company_logo.jpg'}
              alt="Company logo"
              className="w-full h-full object-cover"
              onError={(e) => (e.target.src = '/assets/company_logo.jpg')}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center gap-4">
              <div>
                <h3 className="font-medium text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-600 mt-0.5">{job.company}</p>
              </div>
            </div>

            {/* Tech Stack */}
            {job.tech && job.tech.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {job.tech.map((tech, i) => (
                  <span key={i} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Date & Rating */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <span className="text-sm text-gray-500">{job.date || 'N/A'}</span>
              {isCompleted && job.rating && typeof job.rating === 'number' && (
                <div className="flex items-center gap-2">
                  <Stars rating={job.rating} />
                  <span className="text-sm text-gray-600">{job.rating.toFixed(1)}/5</span>
                </div>
              )}
              {isPaid ? (
                <span className="text-sm font-medium text-green-600">{job.price}</span>
              ) : (
                <span className="text-sm font-medium text-red-600">{job.price || 'Not paid'}</span>
              )}
            </div>

            {isLeft && job.cancelReason && (
              <p className="text-sm text-red-600 mt-2">{job.cancelReason}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isLeft && (
              <button 
                className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
              >
                Left Job
              </button>
            )}
            {isLeft && (
              <button
                onClick={handleChat}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Chat
              </button>
            )}
            <button 
              onClick={handleSeeMore}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              See More
            </button>
            {(isCompleted || isLeft) && eligibility?.canGiveFeedback && (
              <button
                onClick={handleLeaveFeedback}
                className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                Leave Feedback
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardPage title="Job History">
      <p className="text-gray-500 -mt-6 mb-6">View your completed and past jobs</p>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Your Job History</h2>
          <p className="text-sm text-gray-500 mt-0.5">All completed and past jobs</p>
        </div>
        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
              <p className="text-gray-500">Loading job history...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-red-600 mb-2">Error loading job history</p>
              <p className="text-gray-500 mb-4">{typeof error === 'string' ? error : error?.message || 'Unknown error'}</p>
              <button
                onClick={() => dispatch(loadJobHistory())}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (!jobs || jobs.length === 0) && (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-gray-700 mb-1">No job history found</p>
              <p className="text-gray-500">You haven't completed any jobs yet.</p>
            </div>
          )}

          {!loading && !error && jobs?.length > 0 && (
            <div className="space-y-3">
              {jobs.map(renderJobCard)}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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