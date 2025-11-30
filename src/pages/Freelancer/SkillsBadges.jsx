import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import BadgesList from '../Profile/BadgesList';
import { listQuizzes, selectAllQuizzes, selectQuizzesLoading } from '../../store/slices/quizzesSlice';
import { loadUserBadges, selectUserBadges, selectBadgesLoading } from '../../store/slices/badgesSlice';
import { loadUserAttempts, selectUserAttempts, selectUserAttemptsLoading } from '../../store/slices/attemptsSlice';
import { selectUserId } from '../../store/slices/authSlice';

const FreelancerSkillsBadges = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  
  // Redux selectors
  const userId = useSelector(selectUserId) || user?.id;
  const quizzes = useSelector(selectAllQuizzes);
  const badges = useSelector((state) => selectUserBadges(state, userId));
  const attempts = useSelector((state) => selectUserAttempts(state, userId));
  const quizzesLoading = useSelector(selectQuizzesLoading);
  const badgesLoading = useSelector(selectBadgesLoading);
  const attemptsLoading = useSelector((state) => selectUserAttemptsLoading(state, userId));
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Categories');

  useEffect(() => {
    dispatch(listQuizzes());
    if (userId) {
      dispatch(loadUserBadges(userId));
      dispatch(loadUserAttempts(userId));
    }
  }, [dispatch, userId]);

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

  const loading = quizzesLoading || badgesLoading || attemptsLoading;

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Skills & Badges</h2>
          <p className="text-sm text-gray-500 mt-1">Earn badges by completing tasks and showcasing your expertise. Take quizzes to add new skills to your profile.</p>
        </div>

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
                              {isPassed ? '✓ Passed' : 'Attempted'}
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
                            {quizAttempts.length}/3 attempts
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
                          quizAttempts.length >= 3 
                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        onClick={(e) => {
                          if (quizAttempts.length >= 3) {
                            e.preventDefault();
                            alert('Maximum 3 attempts reached for this quiz');
                          }
                        }}
                      >
                        {quizAttempts.length >= 3 ? 'Max Attempts' : isPassed ? 'Retake Quiz' : 'Take Quiz'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        

      </div>
    </DashboardLayout>
  );
};

export default FreelancerSkillsBadges;

