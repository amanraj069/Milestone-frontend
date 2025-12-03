import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../components/DashboardPage';
import FeedbackForm from '../../components/FeedbackForm';
import { loadJobHistory, selectJobHistory, selectJobsLoading, selectJobsError } from '../../redux/slices/jobsSlice';
import { checkCanGiveFeedback, selectFeedbackEligibility } from '../../redux/slices/feedbackSlice';

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
  const jobs = useSelector(selectJobHistory);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const feedbackEligibilityMap = useSelector((state) => state.feedback.eligibilityByJob || {});

  const [feedbackModal, setFeedbackModal] = useState(null);

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
      navigate(`/freelancer/jobs/${jobId}`);
    };

    return (
      <div
        key={jobId}
        className="bg-white rounded-xl shadow-sm mb-6 flex gap-6 hover:shadow-md transition-shadow"
      >
        {/* Logo */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-100">
          <img
            src={job.logo || '/assets/company_logo.jpg'}
            alt="Company logo"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.src = '/assets/company_logo.jpg')}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
              <p className="text-gray-600 font-medium mt-1">{job.company}</p>
            </div>

            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : isLeft 
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isCompleted ? 'Completed' : isLeft ? 'Left Job' : job.status}
            </span>
          </div>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(job.tech || []).map((tech, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full border border-sky-200"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Date & Rating */}
          <div className="flex flex-wrap items-center gap-6 mt-5 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-blue-600 font-bold">Date:</span>
              <span>{job.date || 'N/A'}</span>
            </div>

            {isCompleted && job.rating && typeof job.rating === 'number' && (
              <div className="ml-auto flex items-center gap-3">
                <Stars rating={job.rating} />
                <span className="font-semibold text-gray-700">
                  {(job.rating).toFixed(1)} / 5
                </span>
              </div>
            )}
          </div>

          {isLeft && job.cancelReason && (
            <p className="text-red-600 italic mt-3 text-sm">{job.cancelReason}</p>
          )}
        </div>

        {/* Right Column — Perfectly Aligned Buttons */}
        <div className="flex flex-col items-end gap-3 min-w-[140px]">
          {/* See More Button */}
          <button 
            onClick={handleSeeMore}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            See More
          </button>

          {/* Leave Feedback Button - Show for completed OR left jobs if eligible */}
          {(isCompleted || isLeft) && eligibility?.canGiveFeedback && (
            <button
              onClick={handleLeaveFeedback}
              className="w-full px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Leave Feedback
            </button>
          )}

          {/* Price or Not Paid */}
          {isPaid ? (
            <div className="w-full px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-lg text-center border border-emerald-300">
              {job.price}
            </div>
          ) : (
            <div className="w-full px-4 py-2 bg-red-100 text-red-800 text-sm font-bold rounded-lg text-center border border-red-300">
              {job.price || 'Not paid'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardPage title="Job History">
      <div className="mx-auto">
        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm">
          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading job history...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-600">
              <p className="text-xl font-semibold mb-2">Error loading job history</p>
              <p className="mb-4">{typeof error === 'string' ? error : error?.message || 'Unknown error'}</p>
              <button
                onClick={() => dispatch(loadJobHistory())}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (!jobs || jobs.length === 0) && (
            <div className="text-center py-20 text-gray-500">
              <h3 className="text-2xl font-semibold text-gray-700">No job history found</h3>
              <p className="mt-2">You haven't completed any jobs yet.</p>
            </div>
          )}

          {!loading && !error && jobs?.length > 0 && (
            <div className="space-y-4">
              {jobs.map(renderJobCard)}
            </div>
          )}
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
      </div>
    </DashboardPage>
  );
}