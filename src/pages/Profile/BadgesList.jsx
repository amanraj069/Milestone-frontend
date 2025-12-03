import React, { useEffect, useState } from 'react';

export default function BadgesList({ userId }){
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ 
    if (userId) fetchBadges(); 
  }, [userId]);

  async function fetchBadges(){
    try {
      const res = await fetch(`http://localhost:9000/api/quizzes/users/${userId}/badges`, { credentials: 'include' });
      const j = await res.json();
      if (j.success) setBadges(j.data);
    } catch (err) {
      console.error('Error fetching badges:', err);
    }
    setLoading(false);
  }

  if (!userId) return <div className="text-sm text-gray-500">User not found</div>;
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600 mb-2"></div>
        <p className="text-sm text-gray-500">Loading badges...</p>
      </div>
    );
  }

  return (
    <div>
      {badges.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No badges earned yet. Take quizzes to earn skill badges!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              {/* Badge Icon */}
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              
              {/* Badge Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {b.badge?.title || 'Badge'}
                </h3>
                <p className="text-xs text-gray-500">
                  {b.badge?.skillName || 'Skill'} • {new Date(b.awardedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Verified indicator */}
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
