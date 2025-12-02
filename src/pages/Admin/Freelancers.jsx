import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const AdminFreelancers = () => {
  const { openChatWith } = useChatContext();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/freelancers`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setFreelancers(response.data.freelancers || []);
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      setError('Failed to load freelancers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFreelancer = async (freelancerId, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete freelancer "${name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleting(freelancerId);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/freelancers/${freelancerId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setFreelancers(freelancers.filter(f => f.freelancerId !== freelancerId));
        alert('Freelancer deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting freelancer:', error);
      alert('Failed to delete freelancer. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleChat = (freelancer) => {
    if (!freelancer.userId) {
      alert('Error: Unable to start chat. User ID not found.');
      return;
    }
    openChatWith(freelancer.userId);
  };

  const filteredFreelancers = freelancers.filter(freelancer =>
    freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    freelancer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    freelancer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="space-y-6">
      <p className="text-gray-500 -mt-6">View and manage all registered freelancers</p>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500">Total: {filteredFreelancers.length}</div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading freelancers...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-red-600 mb-2">Error loading freelancers</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchFreelancers} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      )}

      {!loading && !error && filteredFreelancers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No freelancers found</p>
          <p className="text-gray-500">{searchTerm ? 'No freelancers match your search.' : 'There are no registered freelancers.'}</p>
        </div>
      )}

      {!loading && !error && filteredFreelancers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFreelancers.map((freelancer) => (
                  <tr key={freelancer.freelancerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={freelancer.picture}
                        alt={freelancer.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{freelancer.name}</td>
                    <td className="px-4 py-3 text-gray-600">{freelancer.email}</td>
                    <td className="px-4 py-3 text-gray-600">{freelancer.phone || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(freelancer.joinedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700" onClick={() => handleChat(freelancer)}>Chat</button>
                        <button className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700" onClick={() => handleDeleteFreelancer(freelancer.freelancerId, freelancer.name)} disabled={deleting === freelancer.freelancerId}>
                          {deleting === freelancer.freelancerId ? 'Deleting...' : 'Delete'}
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

  return <DashboardPage title="Freelancers">{content}</DashboardPage>;
};

export default AdminFreelancers;

