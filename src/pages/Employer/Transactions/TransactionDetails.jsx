import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/DashboardLayout';

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
      <DashboardLayout>
        <div className="p-12">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                <p className="text-gray-500">Loading transaction details...</p>
              </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-12">
          <div className="mx-auto">
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
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="p-12">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center py-12">
                <p className="text-gray-500">Transaction not found</p>
              </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-12">
          {/* Header with Back Button */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/employer/transactions')}
              className="flex items-center text-gray-500 hover:text-blue-600 mb-4 transition-colors text-sm"
            >
              ← Back to Transactions
            </button>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Payments & Milestones</h1>
            <div className="h-1 w-32 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
          </div>

        {/* Job and Freelancer Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{transaction.jobTitle}</h2>
              <div className="flex items-center gap-3">
                {transaction.freelancerPicture ? (
                  <img 
                    src={transaction.freelancerPicture} 
                    alt={transaction.freelancerName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {transaction.freelancerName?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-800">{transaction.freelancerName}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500 text-sm">Freelancer</span>
                  <span className="ml-3">{getStatusBadge(transaction.status)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Total Budget</p>
              <p className="text-3xl font-bold text-gray-900">₹{transaction.totalBudget.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Project Completion */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Project Completion</h3>
              <span className="text-2xl font-bold text-blue-600">{transaction.projectCompletion}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${transaction.projectCompletion}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Not Started</span>
              <span>In Progress</span>
              <span>Completed</span>
            </div>
          </div>

          {/* Payment Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Payment Progress</h3>
              <span className="text-2xl font-bold text-green-600">{transaction.paymentPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${transaction.paymentPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Paid: ₹{transaction.paidAmount.toLocaleString()}</span>
              <span>Remaining: ₹{(transaction.totalBudget - transaction.paidAmount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Milestones Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Milestones <span className="text-gray-400 font-normal">({transaction.milestones.length})</span>
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transaction.milestones.map((milestone, index) => (
                  <tr 
                    key={milestone.milestoneId} 
                    className={`hover:bg-gray-50 ${milestone.status === 'paid' ? 'bg-green-50/50' : ''}`}
                  >
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        milestone.status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`font-medium ${milestone.status === 'paid' ? 'text-green-700' : 'text-gray-800'}`}>
                        {milestone.status === 'paid' && <span className="mr-2">✓</span>}
                        {milestone.description}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-semibold text-gray-900">₹{milestone.payment.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-gray-600 text-sm">{milestone.deadline}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {milestone.status === 'paid' ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          ✓ Paid
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePayMilestone(milestone.milestoneId)}
                          disabled={payingMilestone === milestone.milestoneId}
                          className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                            payingMilestone === milestone.milestoneId
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {payingMilestone === milestone.milestoneId ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transaction.milestones.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No milestones have been defined for this job yet.</p>
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="mt-6 bg-gray-900 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Payment Summary</h3>
              <p className="text-gray-400 text-sm">Track your project payments at a glance</p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-3xl font-bold text-green-400">₹{transaction.paidAmount.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Total Paid</p>
              </div>
              <div className="w-px bg-gray-700"></div>
              <div>
                <p className="text-3xl font-bold">₹{(transaction.totalBudget - transaction.paidAmount).toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TransactionDetails;
