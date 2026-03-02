import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import SmartSearchInput from '../../components/SmartSearchInput';
import SmartFilter from '../../components/SmartFilter';

const ModeratorQuizzes = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [attemptFilters, setAttemptFilters] = useState({ freelancer: [], email: [], status: [], badge: [] });
  const [dateFilter, setDateFilter] = useState('');
  const setAttemptFilter = (field) => (values) => setAttemptFilters(prev => ({ ...prev, [field]: values }));

  // Reset attempt filters when expanding a different quiz
  const handleToggleInfo = async (quizId) => {
    setAttemptFilters({ freelancer: [], email: [], status: [], badge: [] });
    setDateFilter('');
    await toggleInfo(quizId);
  };

  const filteredAttempts = useMemo(() => {
    if (!attemptDetails?.attempts) return [];
    return attemptDetails.attempts.filter(a => {
      if (attemptFilters.freelancer.length > 0 && !attemptFilters.freelancer.includes(a.freelancerName)) return false;
      if (attemptFilters.email.length > 0 && !attemptFilters.email.includes(a.email)) return false;
      if (attemptFilters.status.length > 0) {
        const statusLabel = a.passed ? 'Passed' : 'Failed';
        if (!attemptFilters.status.includes(statusLabel)) return false;
      }
      if (attemptFilters.badge.length > 0) {
        const badgeLabel = a.badgeAwarded ? 'Yes' : 'No';
        if (!attemptFilters.badge.includes(badgeLabel)) return false;
      }
      if (dateFilter) {
        const d = new Date(a.attemptedAt);
        const attemptDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (attemptDate !== dateFilter) return false;
      }
      return true;
    });
  }, [attemptDetails, attemptFilters, dateFilter]);

  useEffect(() => { 
    fetchList(); 
  }, []);

  async function fetchList() {
    try {
      const res = await fetch('/api/moderator/quizzes', { credentials: 'include' });
      const j = await res.json();
      if (j.success) {
        setQuizzes(j.data.quizzes || []);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleInfo = async (quizId) => {
    if (expandedQuiz === quizId) {
      setExpandedQuiz(null);
      setAttemptDetails(null);
    } else {
      setExpandedQuiz(quizId);
      setLoadingAttempts(true);
      try {
        const res = await fetch(`/api/moderator/quizzes/${quizId}/attempts`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setAttemptDetails(data.data);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to load attempt details');
      } finally {
        setLoadingAttempts(false);
      }
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

  // Stats calculations
  const totalQuizzes = quizzes.length;
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);
  const avgPassingScore = quizzes.length > 0 
    ? Math.round(quizzes.reduce((sum, q) => sum + (q.passingScore || 0), 0) / quizzes.length) 
    : 0;

  const filteredQuizzes = useMemo(() => {
    const q = quizzes.filter(item => {
      const s = searchTerm.trim().toLowerCase();
      if (!s) return true;
      return (item.title || '').toLowerCase().includes(s) || (item.skillName || '').toLowerCase().includes(s);
    });

    switch (sortBy) {
      case 'questions-desc': return [...q].sort((a,b) => (b.questions?.length||0) - (a.questions?.length||0));
      case 'questions-asc': return [...q].sort((a,b) => (a.questions?.length||0) - (b.questions?.length||0));
      case 'oldest': return [...q].sort((a,b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      case 'newest':
      default: return [...q].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }, [quizzes, searchTerm, sortBy]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-question-circle text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-800">{totalQuizzes}</p>
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
              <p className="text-2xl font-bold text-gray-800">{totalQuestions}</p>
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
              <p className="text-2xl font-bold text-gray-800">{avgPassingScore}%</p>
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
                  onChange={setSearchTerm}
                  dataSource={quizzes}
                  getSearchValue={(item) => item.title || item.skillName || ''}
                  placeholder="Search by quiz title or skill..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="questions-desc">Most Questions</option>
                <option value="questions-asc">Fewest Questions</option>
              </select>
            </div>
          </div>

          {loading ? (
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
              {filteredQuizzes.map(q => (
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
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center gap-1.5">
                                          Freelancer
                                          <SmartFilter
                                            label="Freelancer"
                                            data={attemptDetails?.attempts || []}
                                            field="freelancerName"
                                            selectedValues={attemptFilters.freelancer}
                                            onFilterChange={setAttemptFilter('freelancer')}
                                          />
                                        </div>
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center gap-1.5">
                                          Email
                                          <SmartFilter
                                            label="Email"
                                            data={attemptDetails?.attempts || []}
                                            field="email"
                                            selectedValues={attemptFilters.email}
                                            onFilterChange={setAttemptFilter('email')}
                                          />
                                        </div>
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center gap-1.5">
                                          Status
                                          <SmartFilter
                                            label="Status"
                                            data={attemptDetails?.attempts || []}
                                            field="passed"
                                            selectedValues={attemptFilters.status}
                                            onFilterChange={setAttemptFilter('status')}
                                            valueExtractor={(item) => item.passed ? 'Passed' : 'Failed'}
                                          />
                                        </div>
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center gap-1.5">
                                          Badge
                                          <SmartFilter
                                            label="Badge"
                                            data={attemptDetails?.attempts || []}
                                            field="badgeAwarded"
                                            selectedValues={attemptFilters.badge}
                                            onFilterChange={setAttemptFilter('badge')}
                                            valueExtractor={(item) => item.badgeAwarded ? 'Yes' : 'No'}
                                          />
                                        </div>
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center gap-1.5">
                                          Date
                                          <div className="relative">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                const input = e.currentTarget.nextElementSibling;
                                                if (input?.showPicker) input.showPicker();
                                                else input?.click();
                                              }}
                                              className={`p-0.5 rounded transition-colors ${
                                                dateFilter ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                                              }`}
                                              title={dateFilter ? `Filtered: ${dateFilter}` : 'Filter by date'}
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                              </svg>
                                            </button>
                                            <input
                                              type="date"
                                              value={dateFilter}
                                              max={new Date().toISOString().slice(0, 10)}
                                              onChange={(e) => setDateFilter(e.target.value)}
                                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            {dateFilter && (
                                              <button
                                                type="button"
                                                onClick={() => setDateFilter('')}
                                                className="ml-1 text-blue-600 hover:text-blue-800 text-[10px] font-medium"
                                                title="Clear date filter"
                                              >
                                                ✕
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {filteredAttempts.map((attempt, idx) => (
                                      <tr key={attempt.attemptId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
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
        </div>
      </div>
    </DashboardPage>
  );
};

export default ModeratorQuizzes;