import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const AdminEmployers = () => {
  const { openChatWith } = useChatContext();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchEmployers();
  }, []);

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/employers`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setEmployers(response.data.employers || []);
      }
    } catch (error) {
      console.error('Error fetching employers:', error);
      setError('Failed to load employers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployer = async (employerId, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete employer "${name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleting(employerId);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/employers/${employerId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setEmployers(employers.filter(e => e.employerId !== employerId));
        alert('Employer deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting employer:', error);
      alert('Failed to delete employer. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleChat = (employer) => {
    if (!employer.userId) {
      alert('Error: Unable to start chat. User ID not found.');
      return;
    }
    openChatWith(employer.userId);
  };

  const filteredEmployers = employers.filter(employer =>
    employer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="space-y-6">
      {/* subtitle */}
      <p className="text-gray-500 -mt-6">View and manage all registered employers</p>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500 whitespace-nowrap">Total: {filteredEmployers.length}</div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading employers...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-red-600 mb-2">Error loading employers</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchEmployers} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      )}

      {!loading && !error && filteredEmployers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No employers found</p>
          <p className="text-gray-500">{searchTerm ? 'No employers match your search.' : 'There are no registered employers.'}</p>
        </div>
      )}

      {!loading && !error && filteredEmployers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployers.map((employer) => (
                  <tr key={employer.employerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={employer.picture}
                        alt={employer.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{employer.name}</td>
                    <td className="px-4 py-3 text-gray-600">{employer.companyName || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{employer.email}</td>
                    <td className="px-4 py-3 text-gray-600">{employer.phone || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(employer.joinedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700" onClick={() => handleChat(employer)}>Chat</button>
                        <button className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700" onClick={() => handleDeleteEmployer(employer.employerId, employer.name)} disabled={deleting === employer.employerId}>
                          {deleting === employer.employerId ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return <DashboardPage title="Employers">{content}</DashboardPage>;
};

export default AdminEmployers;

