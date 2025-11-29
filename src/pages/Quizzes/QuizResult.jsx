import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';

export default function QuizResult(){
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result?.attempt;
  const awarded = state?.result?.awardedBadges || [];
  
  if (!result) return (
    <DashboardLayout>
      <div className="p-6">No result data available</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-2 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
              {result.passed ? 'Passed' : 'Failed'}
            </div>
            <div className="text-3xl font-semibold text-gray-700">
              {result.userMarks} / {result.totalMarks}
            </div>
            <div className="text-xl text-gray-600 mt-2">
              {result.percentage.toFixed(1)}%
            </div>
          </div>

          {awarded.length > 0 && (
            <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
              <h3 className="text-xl font-bold text-yellow-800 mb-3">Badges Earned!</h3>
              <div className="space-y-2">
                {awarded.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">{b.title}</div>
                      <div className="text-sm text-gray-600">{b.skillName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h4 className="font-bold text-lg mb-4">Question Breakdown</h4>
            <div className="space-y-3">
              {result.answers.map((a, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">Question {idx + 1}</span>
                  <span className={`font-semibold ${a.awardedMarks > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {a.awardedMarks > 0 ? 'Correct' : 'Incorrect'} - {a.awardedMarks} marks
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex gap-3 justify-center">
            <button 
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              onClick={() => navigate('/freelancer/skills-badges')}
            >
              View All Badges
            </button>
            <button 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => navigate('/freelancer/active-jobs')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
