import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const TransactionDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingMilestone, setPayingMilestone] = useState(null);

  useEffect(() => {
    fetchTransactionDetails();
  }, [jobId]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employer/transactions/${jobId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTransaction(data.data);
      } else {
        setError(data.error || 'Failed to fetch transaction details');
      }
    } catch (err) {
      setError('Failed to fetch transaction details');
      console.error('Error fetching transaction details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayMilestone = async (milestoneId) => {
    try {
      setPayingMilestone(milestoneId);
      const response = await fetch(
        `${API_BASE_URL}/api/employer/transactions/${jobId}/milestones/${milestoneId}/pay`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        await fetchTransactionDetails();
      } else {
        alert(data.error || 'Failed to process payment');
      }
    } catch (err) {
      console.error('Error paying milestone:', err);
      alert('Failed to process payment');
    } finally {
      setPayingMilestone(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      working: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Working' },
      finished: { bg: 'bg-green-100', text: 'text-green-700', label: 'Finished' },
      left: { bg: 'bg-red-100', text: 'text-red-700', label: 'Left' }
    };
    const { bg, text, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    return (
      <span className={`${bg} ${text} px-3 py-1 rounded-full text-sm font-medium`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardPage title="Payments & Milestones">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading transaction details...</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  if (error) {
    return (
      <DashboardPage title="Payments & Milestones">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
              onClick={fetchTransactionDetails}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardPage>
    );
  }

  if (!transaction) {
    return (
      <DashboardPage title="Payments & Milestones">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Transaction not found</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/employer/transactions')}
            className="group flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Transactions
          </button>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Payments & Milestones for Job
          </h1>
        </div>

        {/* Job and Freelancer Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{transaction.jobTitle}</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {transaction.freelancerPicture ? (
                    <img 
                      src={transaction.freelancerPicture} 
                      alt={transaction.freelancerName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                      {transaction.freelancerName?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                  )}
                  <div className="ml-3">
                    <span className="font-semibold text-gray-800">{transaction.freelancerName}</span>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-gray-500 text-sm">Freelancer</span>
                  </div>
                </div>
                {getStatusBadge(transaction.status)}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-gray-500 mb-1">Total Budget</span>
              <span className="text-2xl font-bold text-gray-900">₹{transaction.totalBudget.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Project Completion */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-800">Project Completion</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{transaction.projectCompletion}%</span>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${transaction.projectCompletion}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Not Started</span>
                  <span>In Progress</span>
                  <span>Completed</span>
                </div>
              </div>
            </div>

            {/* Payment Progress */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-800">Payment Progress</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{transaction.paymentPercentage}%</span>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${transaction.paymentPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-gray-400">Paid: ₹{transaction.paidAmount.toLocaleString()}</span>
                  <span className="text-gray-400">Remaining: ₹{(transaction.totalBudget - transaction.paidAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Milestones
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded-full">
                {transaction.milestones.length}
              </span>
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-blue-50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Amount (₹)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transaction.milestones.map((milestone, index) => (
                  <tr 
                    key={milestone.milestoneId} 
                    className={`transition-colors hover:bg-gray-50 ${
                      milestone.status === 'paid' ? 'bg-green-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className={`w-1.5 h-14 rounded-full mr-4 ${
                          milestone.status === 'paid' ? 'bg-gradient-to-b from-green-400 to-green-600' : 
                          milestone.status === 'in-progress' ? 'bg-gradient-to-b from-blue-400 to-blue-600' : 
                          'bg-gradient-to-b from-amber-400 to-amber-500'
                        }`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          milestone.status === 'paid' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        {milestone.status === 'paid' && (
                          <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={`font-medium ${
                          milestone.status === 'paid' ? 'text-green-700' : 'text-gray-800'
                        }`}>
                          {milestone.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="font-semibold text-gray-900">₹{milestone.payment.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-lg text-sm">
                        {milestone.deadline}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {milestone.status === 'paid' ? (
                        <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
                          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Paid
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePayMilestone(milestone.milestoneId)}
                          disabled={payingMilestone === milestone.milestoneId}
                          className={`inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                            payingMilestone === milestone.milestoneId
                              ? 'bg-gray-400 cursor-not-allowed shadow-none transform-none'
                              : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                          }`}
                        >
                          {payingMilestone === milestone.milestoneId ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Pay Now
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transaction.milestones.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Milestones</h3>
              <p className="text-gray-500">No milestones have been defined for this job yet.</p>
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Payment Summary</h3>
              <p className="text-blue-100 text-sm">Track your project payments at a glance</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold">₹{transaction.paidAmount.toLocaleString()}</p>
                <p className="text-blue-200 text-sm">Total Paid</p>
              </div>
              <div className="w-px bg-blue-400/30"></div>
              <div className="text-center">
                <p className="text-3xl font-bold">₹{(transaction.totalBudget - transaction.paidAmount).toLocaleString()}</p>
                <p className="text-blue-200 text-sm">Remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
};

export default TransactionDetails;
