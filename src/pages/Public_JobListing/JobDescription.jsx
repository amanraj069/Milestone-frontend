import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/Home/Footer';

const JobDescription = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');
  
  // Q&A State
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [canAnswer, setCanAnswer] = useState(false);
  const [answerTexts, setAnswerTexts] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState({});

  const apiBaseUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  // Update tab from URL params
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && (tabFromUrl === 'details' || tabFromUrl === 'questions')) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions();
      checkCanAnswer();
    }
  }, [activeTab, jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/jobs/api/${jobId}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setJob(data.job);
      } else {
        setError('Job not found');
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setQuestionsLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/questions/job/${jobId}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const checkCanAnswer = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/questions/job/${jobId}/can-answer`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setCanAnswer(data.canAnswer);
      }
    } catch (err) {
      console.error('Error checking answer permissions:', err);
    }
  };

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || submittingQuestion) return;

    try {
      setSubmittingQuestion(true);
      const response = await fetch(`${apiBaseUrl}/api/questions/job/${jobId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newQuestion }),
      });
      const data = await response.json();

      if (data.success) {
        setNewQuestion('');
        fetchQuestions();
      } else {
        alert(data.error || 'Failed to post question');
      }
    } catch (err) {
      console.error('Error posting question:', err);
      alert('Failed to post question');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handlePostAnswer = async (questionId) => {
    const answerText = answerTexts[questionId];
    if (!answerText?.trim() || submittingAnswer[questionId]) return;

    try {
      setSubmittingAnswer({ ...submittingAnswer, [questionId]: true });
      const response = await fetch(`${apiBaseUrl}/api/questions/${questionId}/answer`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: answerText }),
      });
      const data = await response.json();

      if (data.success) {
        setAnswerTexts({ ...answerTexts, [questionId]: '' });
        fetchQuestions();
      } else {
        alert(data.error || 'Failed to post answer');
      }
    } catch (err) {
      console.error('Error posting answer:', err);
      alert('Failed to post answer');
    } finally {
      setSubmittingAnswer({ ...submittingAnswer, [questionId]: false });
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(dateString);
  };

  const handleApplyNow = () => {
    if (!user) {
      // Redirect to login if not logged in
      navigate('/login', { state: { from: `/jobs/${jobId}` } });
    } else if (user.role === 'Freelancer') {
      // Redirect to application page for freelancers
      navigate(`/jobs/apply/${jobId}`);
    } else {
      // Show message for non-freelancers
      alert('Only Freelancers can apply to jobs.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700 mb-2">Job Not Found</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="text-2xl font-bold text-gray-900">
              <Link to="/" className="hover:text-blue-600 transition-colors">
                Mile<span className="text-blue-600">stone</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  to={
                    user.role === 'Admin'
                      ? '/admin/profile'
                      : user.role === 'Employer'
                      ? '/employer/profile'
                      : '/freelancer/profile'
                  }
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-gray-600 font-medium hover:text-blue-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Job Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            {/* Left Section - Job Info */}
            <div className="flex-1 min-w-0">
              {/* Job Title & Company */}
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
              <h2 className="text-lg font-medium text-blue-600 mb-4">{job.companyName}</h2>

              {/* Job Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    {job.location || 'Not specified'} {job.remote && '(Remote)'}
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-3V4c0-1.11-.89-2-2-2H9c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4h6v2H9V4zm11 15H4v-2h16v2zm0-5H4V8h3v2h2V8h6v2h2V8h3v6z" />
                  </svg>
                  <span className="text-gray-700 text-sm capitalize">
                    {job.jobType.replace('-', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13h14v-2H5v2zm-2 4h14v-2H3v2zm4-8h14V7H7v2z" />
                  </svg>
                  <span className="text-gray-700 text-sm">{job.experienceLevel} Level</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11 17h2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-3v-1h4V8h-2V7h-2v1h-1c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3v1H9v2h2v1zm9-13H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V6h16v12z" />
                  </svg>
                  <span className="text-gray-700 text-sm">
                    ₹{job.budget.amount.toLocaleString()} {job.budget.period}
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg md:col-span-2">
                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                  </svg>
                  <span className="text-gray-700 text-sm">Posted on {formatDate(job.postedDate)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {user && user.role === 'Freelancer' ? (
                  job.hasApplied ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      Application Submitted
                    </div>
                  ) : (
                    <button
                      onClick={handleApplyNow}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                      Apply Now
                    </button>
                  )
                ) : user && user.role !== 'Freelancer' ? (
                  <div className="px-4 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-sm font-medium">
                    Only Freelancers can apply to jobs
                  </div>
                ) : (
                  <button
                    onClick={handleApplyNow}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                    Apply Now
                  </button>
                )}

                {/* Application Deadline */}
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                  </svg>
                  <span className="text-red-600 font-medium text-sm">
                    Deadline: {formatDate(job.applicationDeadline)}
                  </span>
                </div>

                {user && user.role === 'Employer' && user.roleId === job.employerId && (
                  <Link
                    to={`/employer/job-listings/edit/${job.jobId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors no-underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Job
                  </Link>
                )}
              </div>
            </div>

            {/* Right Section - Job Image */}
            <div className="flex-shrink-0 lg:w-56 flex items-center justify-center">
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={job.imageUrl}
                  alt={job.title}
                  className="w-full h-56 object-cover"
                  onError={(e) => {
                    e.target.src = '/assets/company_logo.jpg';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-6 py-3 text-center text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Job Details
              </div>
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`flex-1 px-6 py-3 text-center text-sm font-medium transition-colors ${
                activeTab === 'questions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Questions ({questions.length})
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' ? (
              /* Job Details Tab */
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                  Job Description
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
                    {job.description.text}
                  </p>

                  {job.description.responsibilities &&
                    job.description.responsibilities.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          Responsibilities:
                        </h3>
                        <ul className="space-y-2">
                          {job.description.responsibilities.map((item, index) => (
                            <li key={index} className="text-gray-600 text-sm flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {job.description.requirements &&
                    job.description.requirements.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          Requirements:
                        </h3>
                        <ul className="space-y-2">
                          {job.description.requirements.map((item, index) => (
                            <li key={index} className="text-gray-600 text-sm flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {job.description.skills && job.description.skills.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Technical Skills:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.description.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Questions Tab */
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                  Questions & Answers
                </h2>
                
                {/* Post Question Form - Only for Freelancers */}
                {user && user.role === 'Freelancer' && (
                  <form onSubmit={handlePostQuestion} className="mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-800 mb-2">
                        Have a question about this job?
                      </h3>
                      <textarea
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Ask your question here..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={!newQuestion.trim() || submittingQuestion}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingQuestion ? 'Posting...' : 'Post Question'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {!user && (
                  <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-yellow-800 text-sm">
                      <Link to="/login" className="text-blue-600 font-medium hover:underline">
                        Login
                      </Link>{' '}
                      as a freelancer to ask questions about this job.
                    </p>
                  </div>
                )}

                {/* Questions List */}
                {questionsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
                    <p className="text-gray-500">Loading questions...</p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-lg font-medium text-gray-700 mb-1">No questions yet</p>
                    <p className="text-gray-500">Be the first to ask a question about this job!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <div key={question.questionId} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        {/* Question */}
                        <div className="flex gap-3">
                          <img
                            src={question.askerPicture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'}
                            alt={question.askerName}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">{question.askerName}</span>
                              <span className="text-xs text-gray-500">{formatTimeAgo(question.createdAt)}</span>
                            </div>
                            <p className="text-gray-700 text-sm">{question.text}</p>
                          </div>
                        </div>

                        {/* Answers */}
                        {question.answers && question.answers.length > 0 && (
                          <div className="mt-4 ml-11 space-y-3">
                            {question.answers.map((answer) => (
                              <div key={answer.answerId} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex gap-3">
                                  <img
                                    src={answer.answererPicture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'}
                                    alt={answer.answererName}
                                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                    onError={(e) => {
                                      e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';
                                    }}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-900 text-sm">{answer.answererName}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        answer.answererType === 'Employer' 
                                          ? 'bg-blue-100 text-blue-700' 
                                          : 'bg-green-100 text-green-700'
                                      }`}>
                                        {answer.answererType}
                                      </span>
                                      <span className="text-xs text-gray-500">{formatTimeAgo(answer.createdAt)}</span>
                                    </div>
                                    <p className="text-gray-700 text-sm">{answer.text}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Answer Form - Only for employer or assigned freelancer */}
                        {canAnswer && (
                          <div className="mt-4 ml-11">
                            <div className="flex gap-3">
                              <img
                                src={user?.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'}
                                alt="You"
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1">
                                <textarea
                                  value={answerTexts[question.questionId] || ''}
                                  onChange={(e) => setAnswerTexts({
                                    ...answerTexts,
                                    [question.questionId]: e.target.value
                                  })}
                                  placeholder="Write your answer..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  rows={2}
                                />
                                <div className="mt-2 flex justify-end">
                                  <button
                                    onClick={() => handlePostAnswer(question.questionId)}
                                    disabled={!answerTexts[question.questionId]?.trim() || submittingAnswer[question.questionId]}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {submittingAnswer[question.questionId] ? 'Posting...' : 'Post Answer'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Milestones Card - Only show in details tab */}
        {activeTab === 'details' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h2 className="text-base font-semibold text-gray-900">Project Milestones</h2>
            <p className="text-sm text-gray-500 mt-0.5">Payment schedule and deliverables</p>
          </div>
          {job.milestones && job.milestones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {job.milestones.map((milestone, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{milestone.description}</td>
                      <td className="px-4 py-3 text-gray-600">{milestone.deadline}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{milestone.payment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-gray-700">No milestones defined</p>
              <p className="text-gray-500 mt-1">This project doesn't have specific milestones.</p>
            </div>
          )}
        </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default JobDescription;
