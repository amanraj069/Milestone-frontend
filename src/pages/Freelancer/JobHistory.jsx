import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import './ActiveJobs/ActiveJobs.css'; // if you still need see-more-btn styles

function Stars({ rating = 0 }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div className="flex gap-1">
      {[...Array(full)].map((_, i) => (
        <span key={`full-${i}`} className="text-amber-400 text-lg">★</span>
      ))}
      {half === 1 && <span className="text-amber-400 text-lg">½</span>}
      {[...Array(empty)].map((_, i) => (
        <span key={`empty-${i}`} className="text-slate-300 text-lg">☆</span>
      ))}
    </div>
  );
}

export default function FreelancerJobHistory() {
  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const endpoints = [
        '/api/freelancer/job_history/api',
        '/api/freelancerD/job_history/api',
        '/api/freelancer/jobs/history',
        '/api/freelancer/job-history',
      ];

      let lastErr = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { credentials: 'include' });
          if (!res.ok) {
            lastErr = new Error(`HTTP ${res.status}`);
            continue;
          }

          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('text/html')) continue; // skip SSR pages

          const data = await res.json();

          if (data?.success && Array.isArray(data.historyJobs)) {
            if (!mounted) return;
            setJobs(data.historyJobs);
            setLoading(false);
            return;
          }
          if (Array.isArray(data)) {
            if (!mounted) return;
            setJobs(data);
            setLoading(false);
            return;
          }
        } catch (err) {
          lastErr = err;
        }
      }

      if (!mounted) return;
      setError(lastErr || new Error('Failed to load job history'));
      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, []);

  const renderJobCard = (job) => {
    const isCompleted = job.status === 'finished';
    const isPaid = job.price && !String(job.price).toLowerCase().includes('not');

    return (
      <div
        key={job.id || job._id}
        className="bg-white rounded-xl shadow-sm p-6 mb-6 flex gap-6 hover:shadow-md transition-shadow"
      >
        {/* Logo */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-100">
          <img
            src={job.logo || '/assets/company_logo.jpg'}
            alt="Company logo"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.src = '/assets/company_logo.jpg')}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
              <p className="text-gray-600 font-medium mt-1">{job.company}</p>
            </div>

            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isCompleted ? 'Completed' : job.status === 'left' ? 'Left Job' : 'Cancelled'}
            </span>
          </div>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(job.tech || []).map((tech, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full border border-sky-200"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Date & Rating */}
          <div className="flex flex-wrap items-center gap-6 mt-5 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-blue-600 font-bold">Date:</span>
              <span>{job.date || 'N/A'}</span>
            </div>

            {isCompleted && typeof job.rating === 'number' && (
              <div className="ml-auto flex items-center gap-3">
                <Stars rating={job.rating} />
                <span className="font-semibold text-gray-700">
                  {(job.rating).toFixed(1)} / 5
                </span>
              </div>
            )}
          </div>

          {job.status === 'left' && job.cancelReason && (
            <p className="text-red-600 italic mt-3 text-sm">{job.cancelReason}</p>
          )}
        </div>

        {/* Right Column — Perfectly Aligned Buttons */}
          <div className="flex flex-col items-end gap-3">
            {/* See More Button */}
            <button className="see-more-btn whitespace-nowrap">
              See More
            </button>

            {/* Price or Not Paid */}
            {isPaid ? (
              <div className="price-badge whitespace-nowrap">
                {job.price}
              </div>
            ) : (
              <div className="not-paid-badge whitespace-nowrap">
                {job.price || 'Not paid'}
              </div>
            )}
          </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border-l-4 border-blue-600">
          <h1 className="text-2xl font-bold text-gray-900">Job History</h1>
          <p className="text-gray-600 mt-1">View your completed and cancelled projects</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {loading && (
            <div className="text-center py-16">
              {/* <div className="text-5xl text-blue-600 animate-spin">Loading...</div> */}
              {/* <p className="mt-4 text-gray-600">Loading job history...</p> */}
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-600">
              <p className="text-xl font-semibold mb-2">Error loading job history</p>
              <p className="mb-4">{error.message}</p>
              <button
                onClick={() => window.location.reload}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (!jobs || jobs.length === 0) && (
            <div className="text-center py-20 text-gray-500">
              <div className="text-7xl mb-4">No jobs</div>
              <h3 className="text-2xl font-semibold text-gray-700">No job history found</h3>
              <p className="mt-2">You haven't completed any jobs yet.</p>
            </div>
          )}

          {!loading && !error && jobs?.length > 0 && (
            <div className="space-y-4">
              {jobs.map(renderJobCard)}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}