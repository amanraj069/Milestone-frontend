import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../../components/DashboardPage';
import SuccessModal from '../../../components/freelancer/SuccessModal';
import PlanSelectionModal from '../../../components/freelancer/PlanSelectionModal';
import PaymentProcessingModal from '../../../components/freelancer/PaymentProcessingModal';
import UnsubscribeModal from '../../../components/freelancer/UnsubscribeModal';
import { useAuth } from '../../../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { setSubscriptionPlan, resetSubscription } from '../../../redux/slices/subscriptionSlice';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const FreelancerSubscription = () => {
  const { user, checkAuthStatus } = useAuth();
  const dispatch = useDispatch();
  const subscription = useSelector((state) => state.subscription);
  const [currentPlan, setCurrentPlan] = useState('Basic');
  const [currentDuration, setCurrentDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showPlanSelectionModal, setShowPlanSelectionModal] = useState(false);
  const [showPaymentProcessing, setShowPaymentProcessing] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState(null);

  useEffect(() => {
    if (user?.subscription) {
      setCurrentPlan(user.subscription);
    }
    if (user?.subscriptionDuration) {
      setCurrentDuration(user.subscriptionDuration);
    } else if (subscription.duration) {
      setCurrentDuration(subscription.duration);
    }
  }, [user, subscription]);

  const handleUpgradeToPremium = () => {
    setShowPlanSelectionModal(true);
  };

  const handlePlanSelection = (planData) => {
    setSelectedPlanData(planData);
    setShowPlanSelectionModal(false);
    setShowPaymentProcessing(true);
  };

  const handlePaymentComplete = async () => {
    try {
      setLoading(true);
      
      if (!selectedPlanData) {
        throw new Error('No plan data available');
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/freelancer/upgrade_subscription`,
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
      setShowPaymentProcessing(false);
    }
  };

  const handleDowngradeClick = () => {
    setShowUnsubscribeModal(true);
  };

  const handleConfirmDowngrade = async () => {
    try {
      setLoading(true);
      setShowUnsubscribeModal(false);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/freelancer/downgrade_subscription`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        dispatch(resetSubscription());
        await checkAuthStatus();
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

  const expiryLabel = formatExpiryDate(user?.subscriptionExpiryDate || subscription.expiryDate);

  const basicFeatures = [
    'Core functionality access',
    'Limited project access',
    'Basic support',
  ];

  const premiumFeatures = [
    'Unlimited projects',
    'Advanced analytics',
    'Priority support',
    'Ad-free experience',
    'Advanced freelancing tools',
    'Higher platform visibility',
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
                  {isPremium ? 'Premium tools are active to boost your freelance workflow.' : 'Upgrade to Premium for better visibility and advanced tools.'}
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
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400 line-through decoration-gray-300">
                <i className="fas fa-times-circle text-gray-300"></i>
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400 line-through decoration-gray-300">
                <i className="fas fa-times-circle text-gray-300"></i>
                <span>Higher visibility</span>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium freelancer benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">More Opportunities</p>
              <p className="text-xs text-gray-600 mt-1">Get better discovery and unlock more project opportunities.</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">Advanced Tools</p>
              <p className="text-xs text-gray-600 mt-1">Use analytics and tools to optimize your freelance growth.</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">Priority Support</p>
              <p className="text-xs text-gray-600 mt-1">Get faster support when you need help with client work.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SuccessModal isOpen={showModal} onClose={() => setShowModal(false)} message={modalMessage} />
      <PlanSelectionModal isOpen={showPlanSelectionModal} onClose={() => setShowPlanSelectionModal(false)} onSelectPlan={handlePlanSelection} />
      <PaymentProcessingModal isOpen={showPaymentProcessing} onComplete={handlePaymentComplete} />
      <UnsubscribeModal isOpen={showUnsubscribeModal} onClose={() => setShowUnsubscribeModal(false)} onConfirm={handleConfirmDowngrade} loading={loading} />
    </DashboardPage>
  );
};

export default FreelancerSubscription;
export { FreelancerSubscription };
