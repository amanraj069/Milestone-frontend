import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../../components/DashboardPage';
import SuccessModal from '../../../components/employer/SuccessModal';
import PlanSelectionModal from '../../../components/employer/PlanSelectionModal';
import UnsubscribeModal from '../../../components/employer/UnsubscribeModal';
import PaymentProcessingModal from '../../../components/employer/PaymentProcessingModal';
import { useAuth } from '../../../context/AuthContext';
import { setSubscriptionPlan, resetSubscription } from '../../../redux/slices/subscriptionSlice';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const EmployerSubscription = () => {
  const { user, checkAuthStatus } = useAuth();
  const dispatch = useDispatch();
  const subscriptionState = useSelector((state) => state.subscription);
  
  const [currentPlan, setCurrentPlan] = useState('Basic');
  const [currentDuration, setCurrentDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showPaymentProcessing, setShowPaymentProcessing] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState(null);

  useEffect(() => {
    if (user?.subscription) {
      setCurrentPlan(user.subscription);
    }
    if (user?.subscriptionDuration) {
      setCurrentDuration(user.subscriptionDuration);
    } else if (subscriptionState.duration) {
      setCurrentDuration(subscriptionState.duration);
    }
  }, [user, subscriptionState]);

  const handleUpgradeToPremium = () => {
    setShowPlanModal(true);
  };

  const handlePlanSelection = async (planData) => {
    try {
      setShowPlanModal(false);
      setShowPaymentProcessing(true);
      setSelectedPlanData(planData);
    } catch (error) {
      console.error('Error processing payment:', error);
      setShowPaymentProcessing(false);
      alert('Payment failed. Please try again.');
    }
  };

  const handlePaymentComplete = async () => {
    try {
      setShowPaymentProcessing(false);
      setLoading(true);
      
      if (!selectedPlanData) {
        throw new Error('No plan data available');
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/employer/upgrade_subscription`,
        {
          duration: selectedPlanData.duration,
          paymentDetails: selectedPlanData.paymentDetails
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        dispatch(setSubscriptionPlan({
          plan: 'Premium',
          duration: selectedPlanData.duration,
          expiryDate: response.data.expiryDate,
        }));

        await checkAuthStatus();
        setCurrentDuration(selectedPlanData.duration);
        setModalMessage('Successfully upgraded to Premium Plan!');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert(error.response?.data?.error || 'Failed to upgrade subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradeClick = () => {
    setShowUnsubscribeModal(true);
  };

  const handleConfirmDowngrade = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/employer/downgrade_subscription`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        dispatch(resetSubscription());
        await checkAuthStatus();
        setCurrentDuration(null);
        setShowUnsubscribeModal(false);
        setModalMessage('Successfully downgraded to Basic Plan.');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      alert(error.response?.data?.error || 'Failed to downgrade subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatExpiryDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const expiryLabel = formatExpiryDate(user?.subscriptionExpiryDate || subscriptionState.expiryDate);

  const basicFeatures = [
    'Post up to 3 jobs per month',
    'Basic applicant management',
    'Standard support',
  ];

  const premiumFeatures = [
    'Unlimited job postings',
    'Advanced applicant filtering',
    'Priority job listing',
    'Detailed analytics & insights',
    'Premium support (24/7)',
    'Custom branding options',
  ];

  const isPremium = currentPlan === 'Premium';

  return (
    <DashboardPage title="Subscription">
      <p className="text-gray-500 mb-6 -mt-4">Manage your subscription and unlock premium features</p>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className={`rounded-2xl overflow-hidden border ${isPremium ? 'border-blue-300' : 'border-gray-200'} bg-white shadow-sm`}>
          <div className={`p-6 md:p-8 ${isPremium ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-xs uppercase tracking-wider font-semibold ${isPremium ? 'text-blue-100' : 'text-blue-700'}`}>Current Subscription</p>
                <h2 className={`text-3xl font-bold mt-1 ${isPremium ? 'text-white' : 'text-gray-900'}`}>{currentPlan}</h2>
                <p className={`text-sm mt-2 ${isPremium ? 'text-blue-100' : 'text-gray-600'}`}>
                  {isPremium ? 'Premium hiring features are active on your account.' : 'Upgrade to Premium to get advanced hiring tools.'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isPremium ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                Active Plan
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {currentDuration && (
                <span className={`px-3 py-1 rounded-full text-xs ${isPremium ? 'bg-white/20 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
                  Duration: {currentDuration} month{currentDuration > 1 ? 's' : ''}
                </span>
              )}
              {expiryLabel && (
                <span className={`px-3 py-1 rounded-full text-xs ${isPremium ? 'bg-white/20 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
                  Renewal date: {expiryLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`bg-white border-2 rounded-2xl p-6 shadow-sm ${!isPremium ? 'border-blue-500' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Basic</h3>
              {!isPremium && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">Current</span>}
            </div>
            <div className="mb-5">
              <span className="text-4xl font-bold text-blue-600">₹0</span>
              <span className="text-gray-500"> / month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {basicFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                  <i className="fas fa-check-circle text-green-600"></i>
                  <span>{feature}</span>
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm text-gray-400 line-through decoration-gray-300">
                <i className="fas fa-times-circle text-gray-300"></i>
                <span>Priority job listing</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400 line-through decoration-gray-300">
                <i className="fas fa-times-circle text-gray-300"></i>
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400 line-through decoration-gray-300">
                <i className="fas fa-times-circle text-gray-300"></i>
                <span>Premium support</span>
              </li>
            </ul>
            <button
              className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                !isPremium ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={isPremium ? handleDowngradeClick : null}
              disabled={!isPremium || loading}
            >
              {!isPremium ? 'Current Plan' : loading ? 'Processing...' : 'Switch to Basic'}
            </button>
          </div>

          <div className={`bg-white border-2 rounded-2xl p-6 shadow-sm relative ${isPremium ? 'border-blue-500' : 'border-amber-400'}`}>
            <div className="absolute -top-3 right-5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold">RECOMMENDED</div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
              {isPremium && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">Current</span>}
            </div>
            <div className="mb-5">
              <span className="text-4xl font-bold text-amber-600">₹868</span>
              <span className="text-gray-500"> / month</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                  <i className="fas fa-check-circle text-green-600"></i>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                isPremium
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
              }`}
              onClick={!isPremium ? handleUpgradeToPremium : null}
              disabled={isPremium || loading}
            >
              {isPremium ? 'Current Plan' : loading ? 'Processing...' : 'Upgrade to Premium'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Why teams choose Premium</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">Faster Hiring</p>
              <p className="text-xs text-gray-600 mt-1">Prioritized listings and advanced filters reduce hiring time.</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">Better Insights</p>
              <p className="text-xs text-gray-600 mt-1">Track application quality and listing performance clearly.</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">Priority Support</p>
              <p className="text-xs text-gray-600 mt-1">Get quicker support responses for urgent hiring needs.</p>
            </div>
          </div>
        </div>

        {/* Platform Fee & Listing Priority Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <i className="fas fa-layer-group text-indigo-500"></i>
            Platform Fees &amp; Job Listing Priority
          </h3>
          <p className="text-sm text-gray-500 mb-5">Understand how your job postings are ranked and what fees apply.</p>

          {/* Priority ladder */}
          <div className="space-y-3 mb-6">
            {[
              {
                rank: 1,
                label: 'Premium Subscription + Boosted',
                desc: 'Highest placement on all job boards',
                color: 'from-amber-400 to-orange-500',
                textColor: 'text-white',
                icon: 'fa-crown',
                tag: 'Highest',
              },
              {
                rank: 2,
                label: 'Boosted job (no subscription)',
                desc: 'Above premium subscription jobs',
                color: 'from-amber-100 to-amber-50',
                textColor: 'text-amber-800',
                icon: 'fa-bolt',
                tag: 'High',
              },
              {
                rank: 3,
                label: 'Premium subscription only',
                desc: 'Above standard job listings',
                color: 'from-blue-100 to-blue-50',
                textColor: 'text-blue-800',
                icon: 'fa-star',
                tag: 'Medium',
              },
              {
                rank: 4,
                label: 'Standard (no subscription, no boost)',
                desc: 'Standard placement by date',
                color: 'from-gray-100 to-gray-50',
                textColor: 'text-gray-700',
                icon: 'fa-circle',
                tag: 'Standard',
              },
            ].map((tier) => (
              <div
                key={tier.rank}
                className={`flex items-center gap-4 rounded-xl p-4 bg-gradient-to-r ${tier.color}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${tier.textColor} bg-white/30`}>
                  {tier.rank}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${tier.textColor}`}>{tier.label}</p>
                  <p className={`text-xs ${tier.textColor} opacity-80`}>{tier.desc}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-white/30 ${tier.textColor}`}>{tier.tag}</span>
              </div>
            ))}
          </div>

          {/* Fee table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
            <div className="bg-gray-50 px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">Fee Structure</div>
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-2.5">Type</th>
                  <th className="text-left px-4 py-2.5">Platform fee</th>
                  <th className="text-left px-4 py-2.5">Cap fee</th>
                  <th className="text-left px-4 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">Normal job</td>
                  <td className="px-4 py-3 text-gray-600">2%</td>
                  <td className="px-4 py-3 text-gray-600">0.5% – 2%</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">2.5% – 4%</td>
                </tr>
                <tr className="hover:bg-amber-50">
                  <td className="px-4 py-3 flex items-center gap-1.5 text-amber-800 font-medium"><i className="fas fa-bolt text-amber-500 text-xs"></i>Boosted job</td>
                  <td className="px-4 py-3 text-amber-700 font-semibold">4%</td>
                  <td className="px-4 py-3 text-gray-600">0.5% – 2%</td>
                  <td className="px-4 py-3 font-semibold text-amber-700">4.5% – 6%</td>
                </tr>
              </tbody>
            </table>
            <div className="bg-blue-50 px-4 py-3 text-xs text-blue-700 border-t border-gray-200">
              <strong>Application cap fee tiers:</strong> Unlimited (+2%) · Up to 50 (+1.5%) · Up to 25 (+1%) · Up to 10 (+0.5%). Fees are charged on job budget at posting time.
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SuccessModal isOpen={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
      <PlanSelectionModal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} onSelectPlan={handlePlanSelection} userType="Employer" />
      <UnsubscribeModal isOpen={showUnsubscribeModal} onClose={() => setShowUnsubscribeModal(false)} onConfirm={handleConfirmDowngrade} loading={loading} />
      <PaymentProcessingModal isOpen={showPaymentProcessing} onComplete={handlePaymentComplete} />
    </DashboardPage>
  );
};

export default EmployerSubscription;
export { EmployerSubscription };
