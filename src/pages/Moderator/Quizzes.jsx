import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import SmartSearchInput from '../../components/SmartSearchInput';
import { graphqlQuery } from '../../utils/graphqlClient';

const MODERATOR_QUIZZES_QUERY = `
  query ModeratorQuizzes($first: Int!, $after: String, $page: Int, $search: String, $sortBy: String) {
    moderatorQuizzes(first: $first, after: $after, page: $page, search: $search, sortBy: $sortBy) {
      edges { cursor node { _id title skillName passingScore createdAt questionCount questions { _id } } }
      pageInfo { hasNextPage endCursor }
      total
    }
    moderatorQuizzesMeta {
      summary { totalQuizzes totalQuestions avgPassingScore }
      filterOptions { skills }
    }
  }
`;

const MODERATOR_QUIZ_ATTEMPTS_QUERY = `
  query ModeratorQuizAttempts($quizId: String!, $first: Int!, $after: String, $page: Int) {
    moderatorQuizAttempts(quizId: $quizId, first: $first, after: $after, page: $page) {
      edges { cursor node { attemptId freelancerName email marksObtained totalMarks percentage passed badgeAwarded attemptedAt } }
      pageInfo { hasNextPage endCursor }
      total
      quizTitle
      skillName
      passingScore
      passedAttempts
    }
  }
`;

const ModeratorQuizzes = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoaded, setListLoaded] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState({ totalQuizzes: 0, totalQuestions: 0, avgPassingScore: 0 });
  const [attemptPage, setAttemptPage] = useState(1);
  const [attemptPageSize, setAttemptPageSize] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchList();
  }, [debouncedSearchTerm, sortBy, currentPage, pageSize]);

  useEffect(() => {
    if (expandedQuiz) {
      fetchQuizAttempts(expandedQuiz, attemptPage, attemptPageSize);
    }
  }, [expandedQuiz, attemptPage, attemptPageSize]);

  async function fetchList() {
    try {
      setLoading(true);
      const result = await graphqlQuery(MODERATOR_QUIZZES_QUERY, {
        search: debouncedSearchTerm,
        sortBy,
        first: pageSize,
        page: currentPage,
      });
      const connection = result?.moderatorQuizzes;
      const edges = connection?.edges || [];
      setQuizzes(edges.map((edge) => edge.node));
      setPagination(connection?.pageInfo || null);
      setSummary(result?.moderatorQuizzesMeta?.summary || { totalQuizzes: 0, totalQuestions: 0, avgPassingScore: 0 });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
      setListLoaded(true);
    }
  }

  const fetchQuizAttempts = async (quizId, page = attemptPage, limit = attemptPageSize) => {
    setLoadingAttempts(true);
    try {
      const result = await graphqlQuery(MODERATOR_QUIZ_ATTEMPTS_QUERY, {
        quizId,
        first: limit,
        page,
      });
      const connection = result?.moderatorQuizAttempts;
      const edges = connection?.edges || [];
      setAttemptDetails({
        quizTitle: connection?.quizTitle,
        skillName: connection?.skillName,
        passingScore: connection?.passingScore,
        totalAttempts: connection?.total || 0,
        passedAttempts: connection?.passedAttempts || 0,
        attempts: edges.map((edge) => edge.node),
        pagination: connection?.pageInfo || null,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load attempt details');
    } finally {
      setLoadingAttempts(false);
    }
  };

  const toggleInfo = (quizId) => {
    if (expandedQuiz === quizId) {
      setExpandedQuiz(null);
      setAttemptDetails(null);
    } else {
      setAttemptPage(1);
      setExpandedQuiz(quizId);
    }
  };

  const exportToPDF = (quizId) => {
    if (!attemptDetails) return;
    
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quiz Attempts Report - ${attemptDetails.quizTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #475569; margin-top: 30px; }
          .header { margin-bottom: 30px; }
          .info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .info-item { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #2563eb; color: white; padding: 12px; text-align: left; }
          td { border: 1px solid #e2e8f0; padding: 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .passed { color: #16a34a; font-weight: bold; }
          .failed { color: #dc2626; font-weight: bold; }
          .badge { color: #ca8a04; }
          .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Quiz Attempts Report</h1>
          <div class="info">
            <div class="info-item"><strong>Quiz Title:</strong> ${attemptDetails.quizTitle}</div>
            <div class="info-item"><strong>Skill:</strong> ${attemptDetails.skillName}</div>
            <div class="info-item"><strong>Passing Score:</strong> ${attemptDetails.passingScore}%</div>
            <div class="info-item"><strong>Total Attempts:</strong> ${attemptDetails.totalAttempts}</div>
            <div class="info-item"><strong>Passed Attempts:</strong> ${attemptDetails.passedAttempts} (${attemptDetails.totalAttempts > 0 ? Math.round((attemptDetails.passedAttempts / attemptDetails.totalAttempts) * 100) : 0}%)</div>
            <div class="info-item"><strong>Report Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
        </div>
        
        <h2>Detailed Attempts</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Freelancer Name</th>
              <th>Email</th>
              <th>Marks Obtained</th>
              <th>Total Marks</th>
              <th>Percentage</th>
              <th>Status</th>
              <th>Badge Awarded</th>
              <th>Attempted At</th>
            </tr>
          </thead>
          <tbody>
            ${attemptDetails.attempts.map((attempt, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${attempt.freelancerName}</td>
                <td>${attempt.email}</td>
                <td>${attempt.marksObtained}</td>
                <td>${attempt.totalMarks}</td>
                <td>${attempt.percentage.toFixed(2)}%</td>
                <td class="${attempt.passed ? 'passed' : 'failed'}">
                  ${attempt.passed ? 'PASSED' : 'FAILED'}
                </td>
                <td class="badge">${attempt.badgeAwarded ? 'Yes' : 'No'}</td>
                <td>${new Date(attempt.attemptedAt).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>This report was generated by the Moderator Dashboard</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const headerAction = (
    <Link 
      to="/moderator/quizzes/new" 
      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
    >
      + Create Quiz
    </Link>
  );

  return (
    <DashboardPage title="Quizzes" headerAction={headerAction}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 mt-3 sm:mt-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-question-circle text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Quizzes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{summary.totalQuizzes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-list-ol text-yellow-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Questions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{summary.totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-percentage text-purple-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Avg. Passing Score</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{summary.avgPassingScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">All Quizzes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your skill assessment quizzes</p>
        </div>

        <div className="p-6">
          {/* Search & Sort */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <SmartSearchInput
                  value={searchTerm}
                  onChange={(value) => {
                    setCurrentPage(1);
                    setSearchTerm(value);
                  }}
                  placeholder="Search by quiz title or skill..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSortBy(e.target.value);
                }}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="questions-desc">Most Questions</option>
                <option value="questions-asc">Fewest Questions</option>
              </select>
            </div>
          </div>

          {loading && !listLoaded ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
              <p className="text-gray-500 mt-3">Loading quizzes...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-gray-700">No quizzes found</p>
              <p className="text-gray-500 mt-1 mb-4">Create your first skill quiz to get started</p>
              <Link 
                to="/moderator/quizzes/new" 
                className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Your First Quiz
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {loading && (
                <div className="text-xs text-gray-500 px-1">Updating results...</div>
              )}
              {quizzes.map(q => (
                <div key={q._id} className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{q.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {q.skillName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {q.questions?.length || 0} Questions
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500">
                          {q.passingScore}% to pass
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleToggleInfo(q._id)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          expandedQuiz === q._id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {expandedQuiz === q._id ? 'Hide Stats' : 'View Stats'}
                      </button>
                      <button 
                        onClick={() => navigate(`/moderator/quizzes/${q._id}/edit`)}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {expandedQuiz === q._id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-5">
                      {loadingAttempts ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                          <p className="mt-3 text-gray-500 text-sm">Loading attempt details...</p>
                        </div>
                      ) : attemptDetails ? (
                        <div>
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-gray-900 mb-3">Attempt Statistics</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white p-4 rounded-md border border-gray-200">
                                  <div className="text-xs text-gray-500 mb-1">Total Attempts</div>
                                  <div className="text-xl font-semibold text-gray-900">{attemptDetails.totalAttempts}</div>
                                </div>
                                <div className="bg-white p-4 rounded-md border border-gray-200">
                                  <div className="text-xs text-gray-500 mb-1">Passed</div>
                                  <div className="text-xl font-semibold text-green-600">{attemptDetails.passedAttempts}</div>
                                </div>
                                <div className="bg-white p-4 rounded-md border border-gray-200">
                                  <div className="text-xs text-gray-500 mb-1">Pass Rate</div>
                                  <div className="text-xl font-semibold text-gray-900">
                                    {attemptDetails.totalAttempts > 0 
                                      ? Math.round((attemptDetails.passedAttempts / attemptDetails.totalAttempts) * 100) 
                                      : 0}%
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => exportToPDF(q._id)}
                              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                              Export PDF
                            </button>
                          </div>

                          {attemptDetails.attempts.length > 0 ? (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Detailed Attempts</h4>
                              <div className="overflow-x-auto bg-white rounded-md border border-gray-200">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Freelancer</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badge</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {attemptDetails.attempts.map((attempt, idx) => (
                                      <tr key={attempt.attemptId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600">{((attemptPage - 1) * attemptPageSize) + idx + 1}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{attempt.freelancerName}</td>
                                        <td className="px-4 py-3 text-gray-600">{attempt.email}</td>
                                        <td className="px-4 py-3">
                                          <span className="font-medium text-gray-900">{attempt.marksObtained}</span>
                                          <span className="text-gray-500">/{attempt.totalMarks}</span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                          {attempt.percentage.toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                            attempt.passed 
                                              ? 'bg-green-100 text-green-700' 
                                              : 'bg-red-100 text-red-700'
                                          }`}>
                                            {attempt.passed ? 'Passed' : 'Failed'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3">
                                          {attempt.badgeAwarded ? (
                                            <span className="text-amber-600 font-medium">Yes</span>
                                          ) : (
                                            <span className="text-gray-400">No</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                          {new Date(attempt.attemptedAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                          })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="mt-3 flex items-center justify-end gap-2">
                                <label className="text-xs text-gray-500">Rows:</label>
                                <select
                                  value={attemptPageSize}
                                  onChange={(e) => {
                                    const nextSize = Math.min(100, Math.max(1, Number(e.target.value) || 10));
                                    setAttemptPage(1);
                                    setAttemptPageSize(nextSize);
                                    fetchQuizAttempts(q._id, 1, nextSize);
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                                >
                                  <option value={5}>5</option>
                                  <option value={10}>10</option>
                                  <option value={25}>25</option>
                                  <option value={50}>50</option>
                                </select>
                                <button
                                  onClick={() => {
                                    const nextPage = Math.max(1, attemptPage - 1);
                                    setAttemptPage(nextPage);
                                    fetchQuizAttempts(q._id, nextPage, attemptPageSize);
                                  }}
                                  disabled={loadingAttempts || attemptPage <= 1}
                                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                  Previous
                                </button>
                                <button
                                  onClick={() => {
                                    const nextPage = attemptPage + 1;
                                    setAttemptPage(nextPage);
                                    fetchQuizAttempts(q._id, nextPage, attemptPageSize);
                                  }}
                                  disabled={loadingAttempts || !attemptDetails?.pagination?.hasNextPage}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-white rounded-md border border-gray-200">
                              <p className="font-medium text-gray-700">No attempts yet</p>
                              <p className="text-sm text-gray-500 mt-1">This quiz hasn't been attempted by any freelancer</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-red-600">
                          Failed to load attempt details
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {quizzes.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <label className="text-xs text-gray-500">Rows:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setCurrentPage(1);
                  setPageSize(Math.min(100, Math.max(1, Number(e.target.value) || 25)));
                }}
                className="px-2 py-1 border border-gray-300 rounded-md text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={loading || currentPage <= 1}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={loading || !pagination?.hasNextPage}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardPage>
  );
};

export default ModeratorQuizzes;