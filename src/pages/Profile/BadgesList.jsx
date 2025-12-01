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
  
  if (loading) return <div className="text-sm text-gray-500">Loading badges...</div>;

  return (
    <div>
      {badges.length === 0 ? (
        <div className="text-sm text-gray-500">No badges earned yet. Take quizzes to earn badges!</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-sm transition">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold">{b.badge?.title || 'Badge'}</div>
                <div className="text-sm text-gray-600">{b.badge?.skillName || 'Skill'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Earned: {new Date(b.awardedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
