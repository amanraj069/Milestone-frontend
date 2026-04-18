import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { graphqlQuery } from '../../utils/graphqlClient';
import { useAuth } from '../../context/AuthContext';
import { useSelector } from 'react-redux';
import DashboardPage from '../../components/DashboardPage';
import BadgesList from '../Profile/BadgesList';
import SmartSearchInput from '../../components/SmartSearchInput';
import SmartFilter from '../../components/SmartFilter';
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const API_BASE_URL = getBackendBaseUrl();

const FreelancerSkillsBadges = () => {
  const { user } = useAuth();
  const subscription = useSelector((state) => state.subscription);
  const isPremium = user?.subscription === 'Premium' || subscription?.plan === 'Premium';
  const maxAttempts = isPremium ? 3 : 2;
  const cooldownDays = isPremium ? 5 : 10;
  
  // Local state
  const [quizzes, setQuizzes] = useState([]);
  const [badges, setBadges] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [showMaxAttemptsModal, setShowMaxAttemptsModal] = useState(false);
  const [selectedQuizInfo, setSelectedQuizInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quizzesRes, badgesData, attemptsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/quizzes`, { withCredentials: true }),
          user?.id ? graphqlQuery(`
            query UserBadges($userId: String!) {
              userBadges(userId: $userId) {
                badge {
                  _id
                  title
                  skillName
                  description
                  icon
                }
                awardedAt
              }
            }
          `, { userId: user.id }) : Promise.resolve({ userBadges: [] }),
          user?.id ? axios.get(`${API_BASE_URL}/api/quizzes/users/${user.id}/attempts`, { withCredentials: true }) : Promise.resolve({ data: { success: true, data: [] } })
        ]);
        
        setQuizzes(quizzesRes.data.data || []);
        setBadges(badgesData.userBadges || []);
        setAttempts(attemptsRes.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id]);

  // Get unique quiz IDs from attempts
  const attemptedQuizIds = new Set(attempts.map(a => String(a.quizId)));
  const passedQuizIds = new Set(attempts.filter(a => a.passed).map(a => String(a.quizId)));

  // Get badge skills
  const badgeSkills = new Set(badges.map(b => b.badge?.skillName).filter(Boolean));

  const filteredQuizzes = useMemo(() => {
    let list = quizzes.filter(q => {
      const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           q.skillName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory.length === 0 || filterCategory.includes(q.skillName);
      return matchesSearch && matchesCategory;
    });
    const sorted = [...list];
    switch (sortBy) {
      case 'az':     sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za':     sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'earned': sorted.sort((a, b) => (badgeSkills.has(b.skillName) ? 1 : 0) - (badgeSkills.has(a.skillName) ? 1 : 0)); break;
      case 'recent':
      default:       break;
    }
    return sorted;
  }, [quizzes, searchTerm, filterCategory, sortBy, badgeSkills]);

  const availableSkills = quizzes.length;
  const acquiredSkills = badges.length;
  const progress = availableSkills > 0 ? Math.round((acquiredSkills / availableSkills) * 100) : 0;

  return (
    <DashboardPage title="Skills & Badges">
      <p className="text-gray-500 mt-0 sm:-mt-6 mb-6 text-sm sm:text-base">Earn badges by completing skill assessments</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">{availableSkills}</p>
          <p className="text-xs text-gray-500 mt-1">Available Skills</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-green-600">{acquiredSkills}</p>
          <p className="text-xs text-gray-500 mt-1">Badges Earned</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-blue-600">{attempts.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Attempts</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">{progress}%</p>
          <p className="text-xs text-gray-500 mt-1">Progress</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center mb-6">
          <p className="text-lg font-medium text-red-600 mb-2">Error loading data</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      )}

      {/* Your Badges Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Your Badges</h2>
          <p className="text-sm text-gray-500 mt-0.5">Badges earned from skill assessments</p>
        </div>
        <div className="p-6">
          <BadgesList userId={user?.id} />
        </div>
      </div>

      {/* Search & Filter */}
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
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2.5 bg-white hover:border-gray-300 transition-colors">
            <span className="text-sm text-gray-600">Category</span>
            {filterCategory.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">{filterCategory.length}</span>
            )}
            <SmartFilter
              label="Category"
              data={quizzes}
              field="skillName"
              selectedValues={filterCategory}
              onFilterChange={setFilterCategory}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="recent">Default (Recent)</option>
            <option value="az">A to Z</option>
            <option value="za">Z to A</option>
            <option value="earned">Earned Badges</option>
          </select>
        </div>
      </div>

      {/* Available Skills Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Available Skills</h2>
          <p className="text-sm text-gray-500 mt-0.5">Take quizzes to earn skill badges</p>
        </div>
        <div className="p-6">          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
              <p className="text-gray-500">Loading skills...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-gray-700 mb-1">No skills found</p>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuizzes.map(q => {
                const hasCodeQuestions = q.questions?.some(question => question.hasCode || question.codeSnippet);
                const isAttempted = attemptedQuizIds.has(String(q._id));
                const isPassed = passedQuizIds.has(String(q._id));
                const hasBadge = badgeSkills.has(q.skillName);
                const quizAttempts = attempts.filter(a => String(a.quizId) === String(q._id));
                const bestAttempt = quizAttempts.length > 0 ? quizAttempts.reduce((best, curr) => curr.percentage > best.percentage ? curr : best) : null;
                
                return (
                  <div key={q._id} className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{q.title}</h3>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
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
                          {q.timeLimitMinutes && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-sm text-gray-500">{q.timeLimitMinutes} min</span>
                            </>
                          )}
                          {hasCodeQuestions && (
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-green-400 font-mono">
                              &lt;/&gt; Code
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Status badges */}
                        {hasBadge && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Earned
                          </span>
                        )}
                        {isAttempted && !hasBadge && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            isPassed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {isPassed ? 'Passed' : 'Attempted'}
                          </span>
                        )}
                        {bestAttempt && (
                          <span className="text-sm text-gray-600">
                            Best: {bestAttempt.percentage.toFixed(0)}%
                          </span>
                        )}
                        {quizAttempts.length >= maxAttempts ? (
                          <button
                            className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-400 bg-white cursor-pointer hover:border-gray-400 hover:text-gray-500 transition-colors"
                            onClick={() => {
                              setSelectedQuizInfo({
                                title: q.title,
                                skillName: q.skillName,
                                maxAttempts: maxAttempts,
                                cooldownDays: cooldownDays,
                                isPremium: isPremium
                              });
                              setShowMaxAttemptsModal(true);
                            }}
                          >
                            Max Attempts
                          </button>
                        ) : (
                          <Link
                            to={`/quizzes/${q._id}`}
                            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                          >
                            {!isAttempted && !hasBadge
                              ? 'Take Quiz'
                              : bestAttempt?.percentage === 100
                              ? 'Reattempt'
                              : 'Improve Result'}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && filteredQuizzes.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 -mx-6 -mb-6 mt-4 rounded-b-lg">
              <p className="text-xs text-gray-400">Showing {filteredQuizzes.length} of {quizzes.length} skill{quizzes.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>

        {/* Max Attempts Modal */}
        {showMaxAttemptsModal && selectedQuizInfo && (
          <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-[9999] p-4" onClick={() => setShowMaxAttemptsModal(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-br from-rose-500 to-red-600 px-6 py-8 rounded-t-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/90 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Maximum Attempts Reached</h3>
                    <p className="text-white/80 text-sm">{selectedQuizInfo.skillName}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-5">
                  <p className="text-gray-800 leading-relaxed">
                    Maximum <span className="font-semibold text-red-600">{selectedQuizInfo.maxAttempts} attempts</span> reached for this quiz.
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    You can give this <span className="font-medium text-blue-600">{selectedQuizInfo.skillName}</span> skill quiz after a period of <span className="font-semibold text-red-600">{selectedQuizInfo.cooldownDays} days</span>.
                  </p>
                </div>

                {!selectedQuizInfo.isPremium && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-2">Upgrade to Premium!</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Get <strong>3 attempts</strong> instead of 2 and only <strong>{selectedQuizInfo.cooldownDays === 10 ? '5 days' : '4 days'} cooldown</strong> instead of {selectedQuizInfo.cooldownDays} days.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowMaxAttemptsModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {!selectedQuizInfo.isPremium && (
                    <Link
                      to="/freelancer/subscription"
                      className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors text-center"
                      onClick={() => setShowMaxAttemptsModal(false)}
                    >
                      Upgrade to Premium
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardPage>
  );
};

export default FreelancerSkillsBadges;

