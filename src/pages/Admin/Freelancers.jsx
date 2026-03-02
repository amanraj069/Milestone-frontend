import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const COLUMNS = [
  { key: 'photo',        label: 'Photo',        defaultVisible: true },
  { key: 'name',         label: 'Name',         defaultVisible: true },
  { key: 'email',        label: 'Email',        defaultVisible: true },
  { key: 'phone',        label: 'Phone',        defaultVisible: false },
  { key: 'location',     label: 'Location',     defaultVisible: true },
  { key: 'rating',       label: 'Rating',       defaultVisible: true },
  { key: 'skills',       label: 'Skills',       defaultVisible: false },
  { key: 'subscription', label: 'Subscription', defaultVisible: true },
  { key: 'applications', label: 'Applications', defaultVisible: false },
  { key: 'status',       label: 'Status',       defaultVisible: true },
  { key: 'joined',       label: 'Joined',       defaultVisible: true },
  { key: 'actions',      label: 'Actions',      defaultVisible: true },
];

const SORT_OPTIONS = [
  { value: 'date_desc',         label: 'Date (Newest First)' },
  { value: 'date_asc',          label: 'Date (Oldest First)' },
  { value: 'name_asc',          label: 'Name (A–Z)' },
  { value: 'name_desc',         label: 'Name (Z–A)' },
  { value: 'rating_desc',       label: 'Rating (Highest)' },
  { value: 'rating_asc',        label: 'Rating (Lowest)' },
  { value: 'applications_desc', label: 'Applications (Most)' },
  { value: 'applications_asc',  label: 'Applications (Least)' },
];

const AVATAR_FALLBACK = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';

const AdminFreelancers = () => {
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();

  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [sort, setSort]               = useState('date_desc');
  const [filters, setFilters]         = useState({ location: [], rating: [], subscription: [], status: [] });
  const { visible, setVisible } = useSmartColumnToggle(COLUMNS, 'admin-freelancers-columns');

  const setFilter = (key) => (vals) => setFilters((p) => ({ ...p, [key]: vals }));
  const hasFilters = Object.values(filters).some((v) => v.length > 0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/freelancers`, { credentials: 'include' });
        if (res.ok) { const d = await res.json(); if (d.success) setFreelancers(d.freelancers); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const [sortField, sortDir] = sort.split('_');
  const term = search.toLowerCase();

  const filtered = freelancers
    .filter((f) => {
      if (term && !['name', 'email', 'location', 'phone'].some((k) => (f[k] || '').toLowerCase().includes(term))) return false;
      if (filters.location.length     && !filters.location.includes(f.location))                                    return false;
      if (filters.rating.length       && !filters.rating.includes(f.rating))                                        return false;
      if (filters.subscription.length && !filters.subscription.includes(f.subscription))                            return false;
      if (filters.status.length) {
        const label = f.isCurrentlyWorking ? 'Working' : 'Available';
        if (!filters.status.includes(label)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date')         cmp = new Date(a.joinedDate) - new Date(b.joinedDate);
      else if (sortField === 'name')    cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortField === 'rating')  cmp = (a.rating || 0) - (b.rating || 0);
      else if (sortField === 'applications') cmp = (a.applicationsCount || 0) - (b.applicationsCount || 0);
      return sortDir === 'desc' ? -cmp : cmp;
    });

  const working = freelancers.filter((f) => f.isCurrentlyWorking).length;
  const premium = freelancers.filter((f) => f.isPremium).length;

  if (loading) {
    return (
      <DashboardPage title="Freelancers">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading freelancers…</p>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="Freelancers">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Freelancers', value: freelancers.length, iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
          { label: 'Currently Working', value: working,            iconBg: 'bg-green-100',  iconColor: 'text-green-600',  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
          { label: 'Premium Members',   value: premium,            iconBg: 'bg-purple-100', iconColor: 'text-purple-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /> },
          { label: 'Showing',           value: filtered.length,    iconBg: 'bg-orange-100', iconColor: 'text-orange-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-5 h-5 ${s.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input type="text" placeholder="Search by name, email, location, or phone…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <SmartColumnToggle columns={COLUMNS} visible={visible} onChange={setVisible}
            storageKey="admin-freelancers-columns" label="Columns" />
          {hasFilters && (
            <button onClick={() => setFilters({ location: [], rating: [], subscription: [], status: [] })}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[calc(90vh-20rem)] flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {visible.has('photo')        && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Photo</th>}
                {visible.has('name')         && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>}
                {visible.has('email')        && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>}
                {visible.has('phone')        && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>}
                {visible.has('location')     && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    <div className="flex items-center gap-1.5">Location
                      <SmartFilter label="Location" data={freelancers} field="location"
                        selectedValues={filters.location} onFilterChange={setFilter('location')} />
                    </div>
                  </th>
                )}
                {visible.has('rating')       && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    <div className="flex items-center gap-1.5">Rating
                      <SmartFilter label="Rating" data={freelancers} field="rating"
                        selectedValues={filters.rating} onFilterChange={setFilter('rating')}
                        valueFormatter={(v) => `★ ${Number(v).toFixed(1)}`} />
                    </div>
                  </th>
                )}
                {visible.has('skills')       && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Skills</th>}
                {visible.has('subscription') && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    <div className="flex items-center gap-1.5">Subscription
                      <SmartFilter label="Subscription" data={freelancers} field="subscription"
                        selectedValues={filters.subscription} onFilterChange={setFilter('subscription')} />
                    </div>
                  </th>
                )}
                {visible.has('applications') && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applications</th>}
                {visible.has('status')       && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    <div className="flex items-center gap-1.5">Status
                      <SmartFilter label="Status"
                        data={freelancers.map((f) => ({ ...f, _sl: f.isCurrentlyWorking ? 'Working' : 'Available' }))}
                        field="_sl" selectedValues={filters.status} onFilterChange={setFilter('status')} />
                    </div>
                  </th>
                )}
                {visible.has('joined')       && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>}
                {visible.has('actions')      && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? filtered.map((fl) => (
                <tr key={fl.freelancerId} className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/freelancers/${fl.freelancerId}`)}>
                  {visible.has('photo')        && (
                    <td className="px-4 py-3">
                      <img src={fl.picture || AVATAR_FALLBACK} alt={fl.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        onError={(e) => { e.target.src = AVATAR_FALLBACK; }} />
                    </td>
                  )}
                  {visible.has('name')         && <td className="px-4 py-3 font-medium text-gray-900 text-sm">{fl.name}</td>}
                  {visible.has('email')        && <td className="px-4 py-3 text-sm text-gray-600">{fl.email}</td>}
                  {visible.has('phone')        && <td className="px-4 py-3 text-sm text-gray-600">{fl.phone && fl.phone !== 'N/A' ? fl.phone : '—'}</td>}
                  {visible.has('location')     && <td className="px-4 py-3 text-sm text-gray-600">{fl.location && fl.location !== 'N/A' ? fl.location : '—'}</td>}
                  {visible.has('rating')       && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-xs">★</span>
                        <span className="font-medium text-gray-900 text-sm">{Number(fl.rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                  )}
                  {visible.has('skills')       && <td className="px-4 py-3 text-sm text-gray-700">{fl.skills ?? 0} skills</td>}
                  {visible.has('subscription') && (
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        fl.subscription === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>{fl.subscription || 'Basic'}</span>
                    </td>
                  )}
                  {visible.has('applications') && <td className="px-4 py-3 text-sm text-gray-700 font-medium">{fl.applicationsCount ?? 0}</td>}
                  {visible.has('status')       && (
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${fl.isCurrentlyWorking ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${fl.isCurrentlyWorking ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        {fl.isCurrentlyWorking ? 'Working' : 'Available'}
                      </span>
                    </td>
                  )}
                  {visible.has('joined')       && <td className="px-4 py-3 text-sm text-gray-500">{fl.joinedDate ? new Date(fl.joinedDate).toLocaleDateString() : 'N/A'}</td>}
                  {visible.has('actions')      && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button onClick={() => openChatWith(fl.userId)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition-colors">Chat</button>
                        <button onClick={() => navigate(`/admin/freelancers/${fl.freelancerId}`)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors">View</button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={visible.size} className="px-4 py-12 text-center text-gray-400">No freelancers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 mt-auto">
          Showing {filtered.length} of {freelancers.length} freelancers
        </div>
      </div>
    </DashboardPage>
  );
};

export default AdminFreelancers;
