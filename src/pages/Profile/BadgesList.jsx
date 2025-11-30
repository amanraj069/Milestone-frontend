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
              <div className="text-3xl">🎖️</div>
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
