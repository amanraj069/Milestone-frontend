import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';

export default function QuizResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const result = state?.attempt;
  const awarded = state?.awardedBadges || [];

  if (!result) {
    return (
      <DashboardPage title="Quiz Result">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No Result Data Available</p>
          <p className="text-gray-500 mb-4">Unable to load quiz results. Please try taking the quiz again.</p>
          <button 
            onClick={() => navigate('/freelancer/skills-badges')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Skills & Badges
          </button>
        </div>
      </DashboardPage>
    );
  }

  const headerAction = (
    <button
      onClick={() => navigate('/freelancer/skills-badges')}
      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      View All Badges
    </button>
  );

  // Calculate stats
  const correctAnswers = result.answers.filter(a => a.awardedMarks > 0).length;
  const totalQuestions = result.answers.length;

  return (
    <DashboardPage title="Quiz Result" headerAction={headerAction}>
      <p className="text-gray-500 -mt-6 mb-6">Your quiz attempt results</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className={`text-2xl font-semibold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
            {result.passed ? 'Passed' : 'Failed'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Status</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">{result.userMarks}/{result.totalMarks}</p>
          <p className="text-xs text-gray-500 mt-1">Score</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">{result.percentage.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Percentage</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">{correctAnswers}/{totalQuestions}</p>
          <p className="text-xs text-gray-500 mt-1">Correct Answers</p>
        </div>
      </div>

      {/* Badges Earned */}
      {awarded.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <h2 className="text-base font-semibold text-gray-900">Badges Earned!</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badge</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {awarded.map((b, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.title}</td>
                    <td className="px-4 py-3 text-gray-600">{b.skillName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Question Breakdown</h2>
          <p className="text-sm text-gray-500 mt-0.5">Detailed results for each question</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {result.answers.map((a, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">Question {idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      a.awardedMarks > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {a.awardedMarks > 0 ? 'Correct' : 'Incorrect'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.awardedMarks} marks</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <button 
          onClick={() => navigate('/freelancer/skills-badges')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
        >
          View All Badges
        </button>
        <button 
          onClick={() => navigate('/freelancer/home')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </DashboardPage>
  );
}
