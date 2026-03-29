import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';
import { graphqlQuery } from '../../utils/graphqlClient';

const AVATAR_FALLBACK = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';

const ADMIN_EMPLOYER_DETAIL_QUERY = `
  query AdminEmployerDetail($employerId: String!) {
    adminEmployerDetail(employerId: $employerId) {
      employerId userId name email phone picture location aboutMe
      companyName websiteLink rating subscription subscriptionDuration subscriptionExpiryDate joinedDate
      jobListingsCount currentHiresCount pastHiresCount
      jobs { jobId title budget status jobType experienceLevel location postedDate applicationDeadline applicantsCount hasAssignedFreelancer }
      currentFreelancers { freelancerId name email picture rating startDate }
      pastFreelancers { freelancerId name email picture rating }
    }
  }
`;

const jobStatusColors = {
  open:   'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  paused: 'bg-yellow-100 text-yellow-700',
};

const EmployerDetail = () => {
  const { employerId } = useParams();
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();

  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await graphqlQuery(ADMIN_EMPLOYER_DETAIL_QUERY, { employerId });
        if (result?.adminEmployerDetail) setEmp(result.adminEmployerDetail);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [employerId]);

  if (loading) return (
    <DashboardPage title="Employer Details">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3" />
        <p className="text-gray-500">Loading employer details…</p>
      </div>
    </DashboardPage>
  );

  if (!emp) return (
    <DashboardPage title="Employer Details">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-lg font-medium text-gray-700 mb-1">Employer not found</p>
        <button onClick={() => navigate('/admin/employers')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          Back to Employers
        </button>
      </div>
    </DashboardPage>
  );

  return (
    <DashboardPage title="Employer Details">
      <p className="text-gray-500 -mt-6 mb-6">Complete profile and activity overview</p>

      {/* Back */}
      <button onClick={() => navigate('/admin/employers')}
        className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center gap-2">
        <i className="fas fa-arrow-left text-xs" /> Back to Employers
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <img src={emp.picture || AVATAR_FALLBACK} alt={emp.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => { e.target.src = AVATAR_FALLBACK; }} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{emp.name}</h2>
              {emp.companyName && emp.companyName !== 'N/A' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {emp.companyName}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.subscription === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {emp.subscription || 'Basic'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{emp.email}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {emp.phone && emp.phone !== 'N/A' && (
                <span className="flex items-center gap-1.5"><i className="fas fa-phone text-gray-400 text-xs" />{emp.phone}</span>
              )}
              {emp.location && emp.location !== 'N/A' && (
                <span className="flex items-center gap-1.5"><i className="fas fa-map-marker-alt text-gray-400 text-xs" />{emp.location}</span>
              )}
              {emp.websiteLink && (
                <a href={emp.websiteLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 hover:underline">
                  <i className="fas fa-globe text-gray-400 text-xs" />{emp.websiteLink}
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <i className="fas fa-calendar text-gray-400 text-xs" />
                Joined {emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString() : 'N/A'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-yellow-500"><i className="fas fa-star text-xs" /></span>
                {Number(emp.rating || 0).toFixed(1)}
              </span>
            </div>
            {emp.aboutMe && <p className="mt-3 text-sm text-gray-500">{emp.aboutMe}</p>}
          </div>
          <button onClick={() => openChatWith(emp.userId)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
            <i className="fas fa-comment text-xs" /> Chat
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Job Listings',    value: emp.jobListingsCount,  color: 'text-blue-600' },
          { label: 'Current Hires',   value: emp.currentHiresCount, color: 'text-green-600' },
          { label: 'Past Hires',      value: emp.pastHiresCount,    color: 'text-gray-900' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Current Freelancers */}
      {emp.currentFreelancers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-users text-green-500" /> Currently Working With
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{emp.currentFreelancers.length}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {emp.currentFreelancers.map((fl) => (
              <div key={fl.freelancerId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <img src={fl.picture || AVATAR_FALLBACK} alt={fl.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  onError={(e) => { e.target.src = AVATAR_FALLBACK; }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fl.name}</p>
                  <p className="text-xs text-gray-400 truncate">{fl.email}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-xs text-gray-600">{Number(fl.rating || 0).toFixed(1)}</span>
                    {fl.startDate && (
                      <span className="text-xs text-gray-400 ml-1">since {new Date(fl.startDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Freelancers */}
      {emp.pastFreelancers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-history text-gray-500" /> Previously Worked With
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{emp.pastFreelancers.length}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {emp.pastFreelancers.map((fl) => (
              <div key={fl.freelancerId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <img src={fl.picture || AVATAR_FALLBACK} alt={fl.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  onError={(e) => { e.target.src = AVATAR_FALLBACK; }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fl.name}</p>
                  <p className="text-xs text-gray-400 truncate">{fl.email}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-xs text-gray-600">{Number(fl.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Listings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Job Listings</h3>
          <p className="text-sm text-gray-500 mt-1">All jobs posted by this employer</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applicants</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Posted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {emp.jobs.length > 0 ? emp.jobs.map((job, i) => (
                <tr key={job.jobId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{job.title}</p>
                    {job.location && <p className="text-xs text-gray-400 mt-0.5">{job.location}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">${job.budget?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 capitalize">{job.jobType}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{job.experienceLevel}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${jobStatusColors[job.status] || 'bg-gray-100 text-gray-600'}`}>
                      {job.status || 'open'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{job.applicantsCount}</td>
                  <td className="px-4 py-3">
                    {job.hasAssignedFreelancer
                      ? <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Yes</span>
                      : <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">No</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{job.postedDate ? new Date(job.postedDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">No job listings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {emp.jobs.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            {emp.jobs.length} total job listings
          </div>
        )}
      </div>
    </DashboardPage>
  );
};

export default EmployerDetail;
