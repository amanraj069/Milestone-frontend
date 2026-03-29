import React, { useState, useEffect } from 'react';
import DashboardPage from '../../components/DashboardPage';
import { graphqlQuery } from '../../utils/graphqlClient';

/* ───────────────── SVG Donut Chart ───────────────── */
const DonutChart = ({ segments, size = 180, thickness = 32, centerLabel, centerSub }) => {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 4;
  const r = R - thickness;
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);

  const polar = (angleDeg, radius) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const buildSlice = (startDeg, endDeg) => {
    const gap = 1.8;
    const s  = polar(startDeg + gap / 2, R);
    const e  = polar(endDeg   - gap / 2, R);
    const si = polar(startDeg + gap / 2, r);
    const ei = polar(endDeg   - gap / 2, r);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${s.x.toFixed(2)} ${s.y.toFixed(2)}`,
      `A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`,
      `L ${ei.x.toFixed(2)} ${ei.y.toFixed(2)}`,
      `A ${r} ${r} 0 ${large} 0 ${si.x.toFixed(2)} ${si.y.toFixed(2)} Z`,
    ].join(' ');
  };

  let cur = 0;
  const slices = segments.map(seg => {
    const sweep = total > 0 ? (seg.value / total) * 360 : 0;
    const d = sweep > 0.5 ? buildSlice(cur, cur + sweep) : null;
    cur += sweep;
    return { ...seg, d, pct: total > 0 ? Math.round((seg.value / total) * 100) : 0 };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="#f3f4f6" strokeWidth={thickness} />
      ) : (
        slices.map((seg, i) => seg.d && (
          <path key={i} d={seg.d} fill={seg.color}
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.10))' }} />
        ))
      )}
      {centerLabel && (
        <>
          <text x={cx} y={cy - 5} textAnchor="middle" fontSize="12" fontWeight="800" fill="#111827">{centerLabel}</text>
          {centerSub && <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fontWeight="500" fill="#9ca3af" letterSpacing="0.3">{centerSub}</text>}
        </>
      )}
    </svg>
  );
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ───────────────── User Growth Bar Chart ───────────────── */
const UserGrowthChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);

  // Always render the full last-12-month window, padding missing months with 0
  const now = new Date();
  const months12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const lookup = {};
  (data || []).forEach(m => { lookup[`${m.year}-${m.month}`] = m.count; });
  const chartData = months12.map(m => ({
    _id: { year: m.year, month: m.month },
    count: lookup[`${m.year}-${m.month}`] || 0,
  }));

  const maxCount = Math.max(...chartData.map(m => m.count), 1);
  const total = chartData.reduce((s, m) => s + m.count, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">User Growth (Last 12 Months)</h3>
          <p className="text-xs text-gray-400 mt-0.5">{total.toLocaleString()} new users in this period</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <span className="text-xs text-indigo-600 font-semibold">New Signups</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-1.5 px-1" style={{ height: '192px' }}>
        {chartData.map((month, idx) => {
          const label = `${MONTH_NAMES[(month._id.month - 1)]} '${String(month._id.year).slice(2)}`;
          const height = (month.count / maxCount) * 100;
          const isHov = hovered === idx;
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="w-full flex flex-col items-center relative" style={{ height: '160px' }}>
                <div className={`absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-150 z-20 ${isHov ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
                  <div className="bg-[#1e1b4b] text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl text-center">
                    <span className="font-bold">{month.count}</span>
                    <div className="text-indigo-200 text-[10px]">{label}</div>
                  </div>
                  <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1"></div>
                </div>
                <div
                  className="absolute bottom-0 w-full max-w-8 rounded-t-lg transition-all duration-300"
                  style={{
                    height: `${Math.max(height, 3)}%`,
                    background: isHov
                      ? 'linear-gradient(to top, #312e81, #818cf8)'
                      : 'linear-gradient(to top, #4338ca, #a5b4fc)',
                    opacity: isHov ? 1 : (month.count === 0 ? 0.25 : 0.82),
                  }}
                />
              </div>
              <span className="text-[9px] text-gray-400 mt-2 truncate w-full text-center font-medium">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ADMIN_PLATFORM_QUERY = `
  query AdminPlatform {
    adminStatistics {
      userGrowth { year month count }
      jobsByStatus { key count }
      jobsByType { key count }
      jobsByExperience { key count }
      applicationsByStatus { key count }
      complaintsByStatus { key count }
      subscriptionDist { role subscription count }
      recentSignups
      newJobsThisMonth
    }
    adminDashboardOverview {
      users { total freelancers employers moderators premium basic }
      jobs { total active }
      applications { total pending }
      blogs { total }
      quizzes { total }
    }
  }
`;

/* ───────────────── Main Component ───────────────── */
const AdminPlatform = () => {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const result = await graphqlQuery(ADMIN_PLATFORM_QUERY);
        if (result?.adminStatistics) setStats(result.adminStatistics);
        if (result?.adminDashboardOverview) setOverview(result.adminDashboardOverview);
      } catch (error) {
        console.error('Error fetching platform data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const fmt = (val) => (val || 0).toLocaleString('en-IN');

  if (loading) {
    return (
      <DashboardPage title="Platform Analytics">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#4f46e5] animate-spin"></div>
          </div>
          <p className="text-gray-400 mt-5 text-sm font-medium">Loading platform analytics…</p>
        </div>
      </DashboardPage>
    );
  }

  /* ── Normalise data ── */
  const userGrowth       = stats?.userGrowth || [];
  const jobsByStatus     = (stats?.jobsByStatus || []).map(j => ({ _id: j.key, count: j.count }));
  const jobsByType       = (stats?.jobsByType || []).map(j => ({ _id: j.key, count: j.count }));
  const jobsByExp        = (stats?.jobsByExperience || []).map(j => ({ _id: j.key, count: j.count }));
  const appsByStatus     = (stats?.applicationsByStatus || []).map(a => ({ _id: a.key, count: a.count }));
  const complaintsByStatus = (stats?.complaintsByStatus || []).map(c => ({ _id: c.key, count: c.count }));
  const recentSignups    = stats?.recentSignups || 0;
  const newJobsThisMonth = stats?.newJobsThisMonth || 0;

  const ovUsers  = overview?.users || {};
  const ovJobs   = overview?.jobs || {};
  const ovApps   = overview?.applications || {};
  const ovBlogs  = overview?.blogs?.total || 0;
  const ovQuizzes= overview?.quizzes?.total || 0;

  /* Jobs by type colour map */
  const TYPE_COLORS = { 'Fixed': '#4f46e5', 'Hourly': '#7c3aed', 'Milestone': '#0ea5e9', 'Contract': '#14b8a6' };
  const EXP_COLORS  = { 'Entry': '#34d399', 'Intermediate': '#818cf8', 'Expert': '#7c3aed', 'Senior': '#0ea5e9' };
  const APP_COLORS  = { 'Pending': '#f59e0b', 'Accepted': '#14b8a6', 'Rejected': '#ef4444', 'Withdrawn': '#9ca3af' };
  const COMP_COLORS = { 'Pending': '#f59e0b', 'Resolved': '#14b8a6', 'Dismissed': '#9ca3af', 'Under Review': '#818cf8' };

  return (
    <DashboardPage title="Platform Analytics">

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total Jobs',        value: fmt(ovJobs.total),    sub: `${fmt(ovJobs.active)} active`,     icon: 'fas fa-briefcase',    from: 'from-[#4f46e5]',  to: 'to-[#1e1b4b]',   light: 'text-indigo-200' },
          { label: 'New Jobs (30d)',     value: fmt(newJobsThisMonth),sub: 'Posted this month',               icon: 'fas fa-plus-circle',  from: 'from-[#0ea5e9]',  to: 'to-[#0369a1]',   light: 'text-sky-100'    },
          { label: 'Total Users',        value: fmt(ovUsers.total),   sub: `${fmt(ovUsers.freelancers)} freelancers`, icon: 'fas fa-users', from: 'from-[#7c3aed]',  to: 'to-[#312e81]',   light: 'text-violet-200' },
          { label: 'New Signups (30d)',  value: fmt(recentSignups),   sub: 'Joined this month',               icon: 'fas fa-user-plus',   from: 'from-[#818cf8]',  to: 'to-[#3730a3]',   light: 'text-indigo-200' },
          { label: 'Applications',       value: fmt(ovApps.total),    sub: `${fmt(ovApps.pending)} pending`,  icon: 'fas fa-file-alt',    from: 'from-[#ec4899]',  to: 'to-[#9d174d]',   light: 'text-pink-100'   },
          { label: 'Blogs & Quizzes',    value: fmt(ovBlogs),          sub: `${fmt(ovQuizzes)} quizzes`,      icon: 'fas fa-pen-nib',     from: 'from-[#14b8a6]',  to: 'to-[#0f766e]',   light: 'text-teal-100'   },
        ].map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.from} ${card.to} rounded-2xl p-4 text-white shadow-lg relative overflow-hidden`}>
            <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10"></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <p className={`text-[10px] font-bold uppercase tracking-wide ${card.light}`}>{card.label}</p>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <i className={`${card.icon} text-xs`}></i>
              </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight relative z-10">{card.value}</p>
            <p className={`text-[10px] mt-0.5 ${card.light} relative z-10`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── User Growth Chart ── */}
      <div className="mb-6">
        <UserGrowthChart data={userGrowth} />
      </div>

      {/* ── Middle Row: Jobs + Applications/Complaints ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Jobs Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <i className="fas fa-briefcase text-indigo-600 text-sm"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Jobs Distribution</h3>
              <p className="text-[10px] text-gray-400">By status and type</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* By Status */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">By Status</p>
              <div className="relative flex items-center justify-center mb-3">
                <DonutChart
                  segments={jobsByStatus.map(j => ({ label: j._id, value: j.count, color: ({ open:'#4f46e5', active:'#14b8a6', 'in-progress':'#f59e0b', completed:'#312e81', closed:'#9ca3af' }[j._id] || '#e5e7eb') }))}
                  size={140} thickness={28}
                  centerLabel={fmt(jobsByStatus.reduce((s,j)=>s+j.count,0))}
                  centerSub="TOTAL JOBS"
                />
              </div>
              <div className="space-y-1.5">
                {jobsByStatus.map(j => {
                  const color = { open:'#4f46e5', active:'#14b8a6', 'in-progress':'#f59e0b', completed:'#312e81', closed:'#9ca3af' }[j._id] || '#e5e7eb';
                  const total = jobsByStatus.reduce((s,x)=>s+x.count,0);
                  const pct = total > 0 ? Math.round((j.count/total)*100) : 0;
                  return (
                    <div key={j._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                        <span className="text-[11px] text-gray-600 capitalize">{j._id}</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900">{j.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* By Type */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">By Type</p>
              <div className="relative flex items-center justify-center mb-3">
                <DonutChart
                  segments={jobsByType.map(j => ({ label: j._id, value: j.count, color: TYPE_COLORS[j._id] || '#e5e7eb' }))}
                  size={140} thickness={28}
                />
              </div>
              <div className="space-y-1.5">
                {jobsByType.map(j => {
                  const total = jobsByType.reduce((s,x)=>s+x.count,0);
                  const pct = total > 0 ? Math.round((j.count/total)*100) : 0;
                  return (
                    <div key={j._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[j._id] || '#e5e7eb' }}></div>
                        <span className="text-[11px] text-gray-600">{j._id || 'Other'}</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900">{j.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Applications & Complaints */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <i className="fas fa-file-signature text-rose-600 text-sm"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Applications & Complaints</h3>
              <p className="text-[10px] text-gray-400">Status breakdown</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* Applications */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Applications</p>
              <div className="relative flex items-center justify-center mb-3">
                <DonutChart
                  segments={appsByStatus.map(a => ({ label: a._id, value: a.count, color: APP_COLORS[a._id] || '#e5e7eb' }))}
                  size={140} thickness={28}
                  centerLabel={fmt(appsByStatus.reduce((s,a)=>s+a.count,0))}
                  centerSub="TOTAL"
                />
              </div>
              <div className="space-y-1.5">
                {appsByStatus.map(a => {
                  const total = appsByStatus.reduce((s,x)=>s+x.count,0);
                  const pct = total > 0 ? Math.round((a.count/total)*100) : 0;
                  return (
                    <div key={a._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: APP_COLORS[a._id] || '#e5e7eb' }}></div>
                        <span className="text-[11px] text-gray-600">{a._id}</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900">{a.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Complaints */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Complaints</p>
              <div className="relative flex items-center justify-center mb-3">
                <DonutChart
                  segments={complaintsByStatus.map(c => ({ label: c._id, value: c.count, color: COMP_COLORS[c._id] || '#e5e7eb' }))}
                  size={140} thickness={28}
                  centerLabel={fmt(complaintsByStatus.reduce((s,c)=>s+c.count,0))}
                  centerSub="TOTAL"
                />
              </div>
              <div className="space-y-1.5">
                {complaintsByStatus.map(c => {
                  const total = complaintsByStatus.reduce((s,x)=>s+x.count,0);
                  const pct = total > 0 ? Math.round((c.count/total)*100) : 0;
                  return (
                    <div key={c._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COMP_COLORS[c._id] || '#e5e7eb' }}></div>
                        <span className="text-[11px] text-gray-600">{c._id}</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900">{c.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Experience Level + Subscriptions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Jobs by Experience Level */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <i className="fas fa-layer-group text-emerald-600 text-sm"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Jobs by Experience Level</h3>
              <p className="text-[10px] text-gray-400">Demand across skill levels</p>
            </div>
          </div>
          {jobsByExp.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data available</p>
          ) : (() => {
            const maxExp = Math.max(...jobsByExp.map(e => e.count), 1);
            const totalExp = jobsByExp.reduce((s, e) => s + e.count, 0);
            return (
              <div className="space-y-4">
                {jobsByExp.map(e => {
                  const pct = Math.round((e.count / totalExp) * 100);
                  const barW = Math.round((e.count / maxExp) * 100);
                  const color = EXP_COLORS[e._id] || '#9ca3af';
                  return (
                    <div key={e._id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }}></div>
                          <span className="text-xs font-semibold text-gray-700">{e._id || 'Not specified'}</span>
                        </div>
                        <span className="text-xs text-gray-900 font-bold">{e.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barW}%`, backgroundColor: color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* User & Subscription Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <i className="fas fa-crown text-amber-600 text-sm"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">User & Subscription Breakdown</h3>
              <p className="text-[10px] text-gray-400">Who's on the platform</p>
            </div>
          </div>

          {/* User role donut + stats */}
          <div className="flex items-center gap-5 mb-5">
            <div className="relative flex-shrink-0">
              <DonutChart
                segments={[
                  { label: 'Freelancers', value: ovUsers.freelancers || 0, color: '#4f46e5' },
                  { label: 'Employers',   value: ovUsers.employers   || 0, color: '#7c3aed' },
                  { label: 'Moderators',  value: ovUsers.moderators  || 0, color: '#0ea5e9' },
                ]}
                size={140} thickness={28}
                centerLabel={fmt(ovUsers.total)}
                centerSub="USERS"
              />
            </div>
            <div className="flex-1 space-y-2">
              {[
                { label: 'Freelancers', value: ovUsers.freelancers, color: '#4f46e5' },
                { label: 'Employers',   value: ovUsers.employers,   color: '#7c3aed' },
                { label: 'Moderators',  value: ovUsers.moderators,  color: '#0ea5e9' },
              ].map(r => {
                const pct = ovUsers.total > 0 ? Math.round(((r.value||0)/ovUsers.total)*100) : 0;
                return (
                  <div key={r.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }}></div>
                        <span className="text-xs text-gray-600">{r.label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{fmt(r.value)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: r.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscription split */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Subscription Split</p>
            <div className="flex items-center gap-3">
              {[
                { label: 'Premium', value: ovUsers.premium || 0, color: '#4f46e5', bg: 'bg-indigo-50', text: 'text-indigo-700' },
                { label: 'Basic',   value: ovUsers.basic   || 0, color: '#7c3aed', bg: 'bg-violet-50',  text: 'text-violet-700' },
                { label: 'Free',    value: Math.max(0, (ovUsers.total||0) - (ovUsers.premium||0) - (ovUsers.basic||0)), color: '#9ca3af', bg: 'bg-gray-50', text: 'text-gray-600' },
              ].map(s => (
                <div key={s.label} className={`flex-1 p-3 rounded-xl ${s.bg} text-center`}>
                  <div className="w-6 h-6 rounded-full mx-auto mb-1.5" style={{ backgroundColor: s.color }}></div>
                  <p className={`text-base font-extrabold ${s.text}`}>{fmt(s.value)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </DashboardPage>
  );
};

export default AdminPlatform;
