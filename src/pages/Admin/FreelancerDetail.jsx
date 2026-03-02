import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';
const AVATAR_FALLBACK = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';

const statusColors = {
  Accepted: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Pending:  'bg-yellow-100 text-yellow-700',
};

const FreelancerDetail = () => {
  const { freelancerId } = useParams();
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();

  const [fl, setFl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/freelancers/${freelancerId}`, { credentials: 'include' });
        if (res.ok) { const d = await res.json(); if (d.success) setFl(d.freelancer); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [freelancerId]);

  if (loading) return (
    <DashboardPage title="Freelancer Details">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3" />
        <p className="text-gray-500">Loading freelancer details…</p>
      </div>
    </DashboardPage>
  );

  if (!fl) return (
    <DashboardPage title="Freelancer Details">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-lg font-medium text-gray-700 mb-1">Freelancer not found</p>
        <button onClick={() => navigate('/admin/freelancers')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          Back to Freelancers
        </button>
      </div>
    </DashboardPage>
  );

  return (
    <DashboardPage title="Freelancer Details">
      <p className="text-gray-500 -mt-6 mb-6">Complete profile and activity overview</p>

      {/* Back */}
      <button onClick={() => navigate('/admin/freelancers')}
        className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center gap-2">
        <i className="fas fa-arrow-left text-xs" /> Back to Freelancers
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <img src={fl.picture || AVATAR_FALLBACK} alt={fl.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => { e.target.src = AVATAR_FALLBACK; }} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{fl.name}</h2>
              {fl.isCurrentlyWorking
                ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Currently Working</span>
                : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Available</span>}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${fl.subscription === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {fl.subscription || 'Basic'}
              </span>
            </div>
            {fl.isCurrentlyWorking && fl.currentJobTitle && (
              <p className="text-xs text-green-600 font-medium mb-1">Working on: {fl.currentJobTitle}</p>
            )}
            <p className="text-sm text-gray-600 mb-3">{fl.email}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {fl.phone && fl.phone !== 'N/A' && (
                <span className="flex items-center gap-1.5"><i className="fas fa-phone text-gray-400 text-xs" />{fl.phone}</span>
              )}
              {fl.location && fl.location !== 'N/A' && (
                <span className="flex items-center gap-1.5"><i className="fas fa-map-marker-alt text-gray-400 text-xs" />{fl.location}</span>
              )}
              <span className="flex items-center gap-1.5">
                <i className="fas fa-calendar text-gray-400 text-xs" />
                Joined {fl.joinedDate ? new Date(fl.joinedDate).toLocaleDateString() : 'N/A'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-yellow-500"><i className="fas fa-star text-xs" /></span>
                {Number(fl.rating || 0).toFixed(1)}
              </span>
            </div>
            {fl.aboutMe && <p className="mt-3 text-sm text-gray-500">{fl.aboutMe}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => openChatWith(fl.userId)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
              <i className="fas fa-comment text-xs" /> Chat
            </button>
            {fl.resume && (
              <a href={fl.resume} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <i className="fas fa-file-pdf text-xs" /> Resume
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Applications', value: fl.applicationsCount, color: 'text-gray-900' },
          { label: 'Accepted',           value: fl.acceptedCount,     color: 'text-green-600' },
          { label: 'Rejected',           value: fl.rejectedCount,     color: 'text-red-600' },
          { label: 'Pending',            value: fl.pendingCount,      color: 'text-yellow-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Skills */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-code text-blue-500" /> Skills
            <span className="text-xs text-gray-400 font-normal">({fl.skills.length})</span>
          </h3>
          {fl.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {fl.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                  {skill}
                </span>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No skills listed</p>}
        </div>

        {/* Portfolio */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-briefcase text-purple-500" /> Portfolio
            <span className="text-xs text-gray-400 font-normal">({fl.portfolio.length})</span>
          </h3>
          {fl.portfolio.length > 0 ? (
            <div className="space-y-3">
              {fl.portfolio.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block">View Project →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No portfolio items</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Experience */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-building text-orange-500" /> Experience
          </h3>
          {fl.experience.length > 0 ? (
            <div className="space-y-4">
              {fl.experience.map((exp, i) => (
                <div key={i} className="relative pl-4 border-l-2 border-orange-200">
                  <p className="text-sm font-semibold text-gray-900">{exp.title || '—'}</p>
                  {exp.date && <p className="text-xs text-gray-400 mt-0.5">{exp.date}</p>}
                  {exp.description && <p className="text-xs text-gray-500 mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No experience listed</p>}
        </div>

        {/* Education */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-graduation-cap text-green-500" /> Education
          </h3>
          {fl.education.length > 0 ? (
            <div className="space-y-4">
              {fl.education.map((edu, i) => (
                <div key={i} className="relative pl-4 border-l-2 border-green-200">
                  <p className="text-sm font-semibold text-gray-900">{edu.degree || '—'}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{edu.institution || '—'}</p>
                  {edu.date && <p className="text-xs text-gray-400 mt-0.5">{edu.date}</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No education listed</p>}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Recent Applications</h3>
          <p className="text-sm text-gray-500 mt-1">Latest 10 job applications</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Job Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fl.recentApplications.length > 0 ? fl.recentApplications.map((app, i) => (
                <tr key={app.applicationId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{app.jobTitle}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{app.companyName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">${app.budget?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No applications yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {fl.recentApplications.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            Showing {fl.recentApplications.length} of {fl.applicationsCount} applications
          </div>
        )}
      </div>
    </DashboardPage>
  );
};

export default FreelancerDetail;
