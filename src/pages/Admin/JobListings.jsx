import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const AdminJobListings = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/jobs`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to load job listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId, title) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete job "${title}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleting(jobId);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/jobs/${jobId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setJobs(jobs.filter(j => j.jobId !== jobId));
        alert('Job listing deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job listing. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalJobs = jobs.length;
  const totalBudget = jobs.reduce((s, j) => s + (Number(j.budget) || 0), 0);
  const openJobs = jobs.filter(j => j.status === 'Open').length;

  const headerAction = (<div></div>);

  const content = (
    <div className="space-y-6">
      {/* Page Subtitle */}
      <p className="text-gray-500 -mt-6">View and manage all job postings</p>

      {/* Search Bar */}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{totalJobs}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Budget</p>
                <p className="text-2xl font-semibold text-gray-900">Rs.{totalBudget.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Open Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{openJobs}</p>
              </div>
            </div>

            {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title, employer, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500 whitespace-nowrap">Total: {filteredJobs.length}</div>
        </div>
      </div>

      {/* Loading / Error / Empty States */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading jobs...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-red-600 mb-2">Error loading jobs</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchJobs} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      )}

      {!loading && !error && filteredJobs.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No jobs found</p>
          <p className="text-gray-500">{searchTerm ? 'No jobs match your search.' : 'There are no job listings.'}</p>
        </div>
      )}

      {/* Jobs Table */}
      {!loading && !error && filteredJobs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{job.title}</td>
                    <td className="px-4 py-3 text-gray-600">{job.companyName}</td>
                    <td className="px-4 py-3 text-gray-600">Rs.{Number(job.budget || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{job.jobType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        job.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(job.postedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800" onClick={() => handleViewJob(job.jobId)}>View</button>
                        <button className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700" onClick={() => handleDeleteJob(job.jobId, job.title)} disabled={deleting === job.jobId}>
                          {deleting === job.jobId ? 'Deleting...' : 'Delete'}
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

  return <DashboardPage title="Job Listings" headerAction={headerAction}>{content}</DashboardPage>;
};

export default AdminJobListings;

