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
              {result.passed ? '✓ Passed' : '✗ Failed'}
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
              <h3 className="text-xl font-bold text-yellow-800 mb-3">🏆 Badges Earned!</h3>
              <div className="space-y-2">
                {awarded.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded">
                    <div className="text-2xl">🎖️</div>
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
                    {a.awardedMarks > 0 ? '✓' : '✗'} {a.awardedMarks} marks
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
