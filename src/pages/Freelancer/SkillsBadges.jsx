import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DashboardPage from '../../components/DashboardPage';
import BadgesList from '../Profile/BadgesList';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const FreelancerSkillsBadges = () => {
  const { user } = useAuth();
  
  // Local state
  const [quizzes, setQuizzes] = useState([]);
  const [badges, setBadges] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Categories');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quizzesRes, badgesRes, attemptsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/quizzes`, { withCredentials: true }),
          user?.id ? axios.get(`${API_BASE_URL}/api/quizzes/users/${user.id}/badges`, { withCredentials: true }) : Promise.resolve({ data: { success: true, data: [] } }),
          user?.id ? axios.get(`${API_BASE_URL}/api/quizzes/users/${user.id}/attempts`, { withCredentials: true }) : Promise.resolve({ data: { success: true, data: [] } })
        ]);
        
        setQuizzes(quizzesRes.data.data || []);
        setBadges(badgesRes.data.data || []);
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

  return (
    <DashboardPage title="Skills & Badges">
      <p className="text-gray-500 -mt-6 mb-6">Earn badges by completing skill assessments</p>

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

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by skill name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            Showing: {filteredQuizzes.length} of {quizzes.length}
          </span>
        </div>
      </div>

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
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Badge Earned</span>
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
                        <Link 
                          to={`/quizzes/${q._id}`} 
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            quizAttempts.length >= 3 
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          onClick={(e) => {
                            if (quizAttempts.length >= 3) {
                              e.preventDefault();
                              alert('Maximum 3 attempts reached for this quiz');
                            }
                          }}
                        >
                          {quizAttempts.length >= 3 ? 'Max Attempts' : isPassed ? 'Retake' : 'Take Quiz'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardPage>
  );
};

export default FreelancerSkillsBadges;

