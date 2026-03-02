import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

// ── Column definitions ──────────────────────────────────────────────────────
const MOD_COLUMNS = [
  { key: 'photo',    label: 'Photo',    defaultVisible: true },
  { key: 'name',     label: 'Name',     defaultVisible: true },
  { key: 'email',    label: 'Email',    defaultVisible: true },
  { key: 'location', label: 'Location', defaultVisible: true },
  { key: 'joined',   label: 'Joined',   defaultVisible: true },
  { key: 'actions',  label: 'Actions',  defaultVisible: true },
];


// ── Sort option sets ──────────────────────────────────────────────────────────
const MOD_SORT_OPTIONS = [
  { value: 'date_desc',   label: 'Date (Newest First)' },
  { value: 'date_asc',    label: 'Date (Oldest First)' },
  { value: 'name_asc',    label: 'Name (A–Z)' },
  { value: 'name_desc',   label: 'Name (Z–A)' },
];


// ── Shared small components ───────────────────────────────────────────────────
const AVATAR_FALLBACK = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';

const Avatar = ({ src, name }) => (
  <img src={src || AVATAR_FALLBACK} alt={name}
    className="w-10 h-10 rounded-full object-cover border border-gray-200"
    onError={(e) => { e.target.src = AVATAR_FALLBACK; }} />
);

// ── Main Component ────────────────────────────────────────────────────────────
const AdminModerators = () => {
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();

  // ── Moderators state ──
  const [moderators, setModerators]       = useState([]);
  const [modLoading, setModLoading]       = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [modSearch, setModSearch]         = useState('');
  const [modSort, setModSort]             = useState('date_desc');
  const [modFilters, setModFilters]       = useState({ location: [] });
  const { visible: modVisible, setVisible: setModVisible } = useSmartColumnToggle(MOD_COLUMNS, 'admin-moderators-columns');

  // ── Fetching ──────────────────────────────────────────────────────────────
  useEffect(() => { fetchModerators(); }, []);

  const fetchModerators = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/moderators`, { credentials: 'include' });
      if (res.ok) { const d = await res.json(); if (d.success) setModerators(d.moderators); }
    } catch (e) { console.error(e); } finally { setModLoading(false); }
  };

  const handleDeleteModerator = async (moderatorId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/moderators/${moderatorId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { setModerators((prev) => prev.filter((m) => m.moderatorId !== moderatorId)); setDeleteConfirm(null); }
    } catch (e) { console.error(e); }
  };

  // ── Sort + filter helper ──────────────────────────────────────────────────
  const applySortAndFilter = (data, sortStr, search, searchFields, filters, labelMap = {}) => {
    const [field, dir] = sortStr.split('_');
    const term = search.toLowerCase();
    return data
      .filter((item) => {
        if (term && !searchFields.some((f) => (item[f] || '').toLowerCase().includes(term))) return false;
        return Object.entries(filters).every(([k, vals]) => {
          if (!vals.length) return true;
          const val = labelMap[k] ? labelMap[k](item) : item[k];
          return vals.includes(val);
        });
      })
      .sort((a, b) => {
        let cmp = 0;
        if (field === 'date')         cmp = new Date(a.joinedDate) - new Date(b.joinedDate);
        else if (field === 'name')    cmp = (a.name || '').localeCompare(b.name || '');
        else if (field === 'rating')  cmp = (a.rating || 0) - (b.rating || 0);
        else if (field === 'applications') cmp = (a.applicationsCount || 0) - (b.applicationsCount || 0);
        else if (field === 'jobs')    cmp = (a.jobListingsCount || 0) - (b.jobListingsCount || 0);
        else if (field === 'hired')   cmp = (a.hiredCount || 0) - (b.hiredCount || 0);
        return dir === 'desc' ? -cmp : cmp;
      });
  };

  const filteredMods = applySortAndFilter(moderators, modSort, modSearch, ['name', 'email', 'location'], modFilters);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalResolved   = moderators.reduce((s, m) => s + (m.complaintsResolved || 0), 0);
  const totalComplaints = moderators.reduce((s, m) => s + (m.totalComplaints || 0), 0);
  const blogsCreated    = moderators.reduce((s, m) => s + (m.blogsCreated || 0), 0);

  const LoadingSpinner = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
      <p className="text-gray-500 text-sm">Loading…</p>
    </div>
  );

  const ClearFiltersBtn = ({ filters, onClear }) =>
    Object.values(filters).some((v) => v.length > 0) ? (
      <button onClick={onClear}
        className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear Filters
      </button>
    ) : null;

  return (
    <DashboardPage title="Moderator Management">

      {/* ══════════════════ MODERATORS ══════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Moderators',    value: moderators.length, color: 'text-gray-900' },
              { label: 'Complaints Resolved', value: totalResolved,     color: 'text-green-600' },
              { label: 'Total Complaints',    value: totalComplaints,   color: 'text-orange-600' },
              { label: 'Blogs Created',       value: blogsCreated,      color: 'text-blue-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <input type="text" placeholder="Search by name, email, or location..."
                  value={modSearch} onChange={(e) => setModSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              </div>
              <select value={modSort} onChange={(e) => setModSort(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
                {MOD_SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <SmartColumnToggle columns={MOD_COLUMNS} visible={modVisible} onChange={setModVisible} storageKey="admin-moderators-columns" label="Columns" />
              <ClearFiltersBtn filters={modFilters} onClear={() => setModFilters({ location: [] })} />
            </div>
          </div>

          {modLoading ? <LoadingSpinner /> : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {modVisible.has('photo')    && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Photo</th>}
                      {modVisible.has('name')     && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>}
                      {modVisible.has('email')    && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>}
                      {modVisible.has('location') && (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          <div className="flex items-center gap-1.5">Location
                            <SmartFilter label="Location" data={moderators} field="location" selectedValues={modFilters.location}
                              onFilterChange={(v) => setModFilters((p) => ({ ...p, location: v }))} />
                          </div>
                        </th>
                      )}
                      {modVisible.has('joined')   && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>}
                      {modVisible.has('actions')  && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMods.length > 0 ? filteredMods.map((mod) => (
                      <tr key={mod.moderatorId} className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/moderators/${mod.moderatorId}`)}>
                        {modVisible.has('photo')    && <td className="px-4 py-3"><Avatar src={mod.picture} name={mod.name} /></td>}
                        {modVisible.has('name')     && <td className="px-4 py-3 font-medium text-gray-900 text-sm">{mod.name}</td>}
                        {modVisible.has('email')    && <td className="px-4 py-3 text-sm text-gray-600">{mod.email}</td>}
                        {modVisible.has('location') && <td className="px-4 py-3 text-sm text-gray-600">{mod.location && mod.location !== 'N/A' ? mod.location : '—'}</td>}
                        {modVisible.has('joined')   && <td className="px-4 py-3 text-sm text-gray-500">{mod.joinedDate ? new Date(mod.joinedDate).toLocaleDateString() : 'N/A'}</td>}
                        {modVisible.has('actions')  && (
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <button onClick={() => openChatWith(mod.userId)}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition-colors">Chat</button>
                              <button onClick={() => setDeleteConfirm(mod.moderatorId)}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors">Delete</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr><td colSpan={modVisible.size} className="px-4 py-12 text-center text-gray-400">No moderators found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                Showing {filteredMods.length} of {moderators.length} moderators
              </div>
            </div>
          )}


      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Moderator</h3>
            <p className="text-sm text-gray-600 mb-4">This will permanently delete this moderator and their user account. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={() => handleDeleteModerator(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
};

export default AdminModerators;
