import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSelector } from 'react-redux';
import DashboardPage from '../../components/DashboardPage';
import BadgesList from '../Profile/BadgesList';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

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
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [showMaxAttemptsModal, setShowMaxAttemptsModal] = useState(false);
  const [selectedQuizInfo, setSelectedQuizInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quizzesRes, badgesRes, attemptsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/quizzes`, { withCredentials: true }),
          user?.id ? axios.get(`${API_BASE_URL}/api/quizzes/users/${user.id}/badges`, { withCredentials: true }) : Promise.resolve({ data: { success: true, data: [] } }),
          user?.id ? axios.get(`${API_BASE_URL}/api/quizzes/users/${user.id}/attempts`, { withCredentials: true }) : Promise.resolve({ data: { success: true, data: [] } })
        ]);
        
        console.log('Quizzes response:', quizzesRes.data);
        console.log('Badges response:', badgesRes.data);
        console.log('Attempts response:', attemptsRes.data);
        
        setQuizzes(quizzesRes.data.data || []);
        setBadges(badgesRes.data.data || []);
        setAttempts(attemptsRes.data.data || []);
        
        console.log('State set - Quizzes:', quizzesRes.data.data?.length || 0);
        console.log('State set - Badges:', badgesRes.data.data?.length || 0);
        console.log('State set - Attempts:', attemptsRes.data.data?.length || 0);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        console.error('Error response:', err.response?.data);
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

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         q.skillName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All Categories' || q.skillName === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All Categories', ...new Set(quizzes.map(q => q.skillName))];
  const availableSkills = quizzes.length;
  const acquiredSkills = badges.length;
  const progress = availableSkills > 0 ? Math.round((acquiredSkills / availableSkills) * 100) : 0;

  const content = (
    <>
      {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <div className="font-semibold">Error loading data</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-6">
            <div className="text-3xl font-bold text-blue-600">{availableSkills}</div>
            <div className="text-sm text-gray-600 mt-1">Available Skills</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-6">
            <div className="text-3xl font-bold text-green-600">{acquiredSkills}</div>
            <div className="text-sm text-gray-600 mt-1">Acquired Skills</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border-l-4 border-yellow-500 p-6">
            <div className="text-3xl font-bold text-yellow-600">{progress}%</div>
            <div className="text-sm text-gray-600 mt-1">Progress</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Search & Filter Skills</h3>
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search by skill name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Skills</option>
            </select>
            <button 
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              onClick={() => { setSearchTerm(''); setFilterCategory('All Categories'); }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Your Badges Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-800">Your Badges</h3>
            </div>
          </div>
          <BadgesList userId={user?.id} />
        </div>

        <br></br>

        {/* Available Skills Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-800">Available Skills</h3>
            </div>
          </div>          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading quizzes...</div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600 font-medium mb-2">No skills found</div>
              <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
              <button 
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => { setSearchTerm(''); setFilterCategory('All Categories'); }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map(q => {
                const hasCodeQuestions = q.questions?.some(question => question.hasCode || question.codeSnippet);
                const isAttempted = attemptedQuizIds.has(String(q._id));
                const isPassed = passedQuizIds.has(String(q._id));
                const hasBadge = badgeSkills.has(q.skillName);
                const quizAttempts = attempts.filter(a => String(a.quizId) === String(q._id));
                const bestAttempt = quizAttempts.length > 0 ? quizAttempts.reduce((best, curr) => curr.percentage > best.percentage ? curr : best) : null;
                
                return (
                  <div key={q._id} className={`border-2 rounded-lg p-5 hover:shadow-lg transition group ${
                    hasBadge ? 'border-yellow-400 bg-yellow-50' : 
                    isPassed ? 'border-green-400 bg-green-50' : 
                    isAttempted ? 'border-orange-300 bg-orange-50' : 
                    'border-gray-200 hover:border-blue-400'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-lg text-gray-800">{q.title}</div>
                          {/* {hasBadge && (
                            <span className="text-xl" title="Badge Earned!"></span>
                          )} */}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {q.skillName}
                          </div>
                          {hasCodeQuestions && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 text-green-400 text-xs font-mono rounded">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              Code
                            </div>
                          )}
                          {isAttempted && (
                            <div className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                              isPassed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {isPassed ? 'Passed' : 'Attempted'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {q.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{q.description}</p>
                    )}
                    
                    {/* Show attempt history */}
                    {bestAttempt && (
                      <div className="mb-3 p-2 bg-white rounded border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">Best Score:</div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">
                            {bestAttempt.userMarks}/{bestAttempt.totalMarks} ({bestAttempt.percentage.toFixed(1)}%)
                          </div>
                          <div className="text-xs text-gray-500">
                            {quizAttempts.length}/{maxAttempts} attempts
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 space-y-1">
                        {q.timeLimitMinutes && <div>{q.timeLimitMinutes} min</div>}
                        {q.passingScore && <div>Pass: {q.passingScore}%</div>}
                      </div>
                      <Link 
                        to={`/quizzes/${q._id}`} 
                        className={`px-4 py-2 rounded-lg transition text-sm font-semibold group-hover:scale-105 ${
                          quizAttempts.length >= maxAttempts
                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        onClick={(e) => {
                          if (quizAttempts.length >= maxAttempts) {
                            e.preventDefault();
                            setSelectedQuizInfo({
                              title: q.title,
                              skillName: q.skillName,
                              maxAttempts: maxAttempts,
                              cooldownDays: cooldownDays,
                              isPremium: isPremium
                            });
                            setShowMaxAttemptsModal(true);
                          }
                        }}
                      >
                        {quizAttempts.length >= maxAttempts ? 'Max Attempts' : isPassed ? 'Retake Quiz' : 'Take Quiz'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Max Attempts Modal */}
        {showMaxAttemptsModal && selectedQuizInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowMaxAttemptsModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Maximum Attempts Reached</h3>
                    <p className="text-red-100 text-sm mt-1">{selectedQuizInfo.skillName}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 text-lg font-semibold mb-2">
                    Maximum {selectedQuizInfo.maxAttempts} attempts reached for this quiz.
                  </p>
                  <p className="text-gray-600">
                    You can give this <span className="font-semibold text-blue-600">{selectedQuizInfo.skillName}</span> skill quiz after a period of <span className="font-bold text-red-600">{selectedQuizInfo.cooldownDays} days</span>.
                  </p>
                </div>

                {!selectedQuizInfo.isPremium && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-yellow-900 mb-1">Upgrade to Premium!</p>
                        <p className="text-sm text-yellow-800">
                          Get <strong>3 attempts</strong> instead of 2 and only <strong>{selectedQuizInfo.cooldownDays === 10 ? '5 days' : '4 days'} cooldown</strong> instead of {selectedQuizInfo.cooldownDays} days.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3">
                {!selectedQuizInfo.isPremium && (
                  <Link
                    to="/freelancer/subscription"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-600 transition text-center"
                    onClick={() => setShowMaxAttemptsModal(false)}
                  >
                    Upgrade to Premium
                  </Link>
                )}
                <button
                  onClick={() => setShowMaxAttemptsModal(false)}
                  className={`${selectedQuizInfo.isPremium ? 'flex-1' : 'flex-1'} px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );

  return <DashboardPage title="Skills & Badges">{content}</DashboardPage>;
};

export default FreelancerSkillsBadges;

