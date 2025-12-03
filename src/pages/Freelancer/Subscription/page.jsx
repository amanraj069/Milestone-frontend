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

  return (
    <DashboardPage title="Subscription">
      <p className="text-gray-500 mb-8 -mt-4">Manage your subscription and unlock premium features</p>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Current Plan Banner */}
        <div className={`rounded-xl p-6 shadow-md border-l-4 ${
          currentPlan === 'Premium' 
            ? 'bg-gradient-to-r from-indigo-600 to-blue-700 border-amber-500' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-600'
        }`}>
          <div className="flex items-center gap-4">
            <i className={`fas fa-crown text-4xl ${currentPlan === 'Premium' ? 'text-amber-400' : 'text-blue-600'}`}></i>
            <div>
              <h2 className={`text-lg font-semibold mb-1 ${currentPlan === 'Premium' ? 'text-white' : 'text-blue-900'}`}>
                Your Current Plan
              </h2>
              <p className={`text-sm ${currentPlan === 'Premium' ? 'text-white/90' : 'text-blue-700'}`}>
                {currentPlan} {currentDuration && currentDuration === 12 ? '(12 months)' : currentDuration ? `(${currentDuration} month${currentDuration > 1 ? 's' : ''})` : ''} - 
                {currentPlan === 'Basic' ? ' Includes basic features. Upgrade for more!' : ' Premium features unlocked'}
              </p>
            </div>
          </div>
        </div>

        {/* Plans Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-center text-2xl font-semibold text-gray-900 mb-8">Choose Your Plan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Plan */}
            <div className={`border-2 rounded-xl p-8 transition-all flex flex-col ${
              currentPlan === 'Basic' ? 'border-green-500 bg-gradient-to-br from-green-50 to-white' : 'border-gray-300'
            } hover:border-blue-600 hover:-translate-y-1 hover:shadow-xl`}>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Basic</h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-xl font-semibold text-blue-600">₹</span>
                  <span className="text-4xl font-bold text-blue-600 mx-1">0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600">Perfect for getting started with basic functionality and essential features.</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Core functionality</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Limited project access</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Basic support</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-400 line-through">
                  <i className="fas fa-times text-red-500 w-5 text-center"></i>
                  <span>Ads included</span>
                </li>
              </ul>

              <button
                className={`w-full px-6 py-3.5 rounded-lg text-base font-semibold transition-all ${
                  currentPlan === 'Basic' 
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg'
                }`}
                onClick={currentPlan === 'Premium' ? handleDowngradeClick : null}
                disabled={currentPlan === 'Basic' || loading}
              >
                {currentPlan === 'Basic' ? 'Current Plan' : loading ? 'Processing...' : 'Downgrade to Basic'}
              </button>
            </div>

            {/* Premium Plan */}
            <div className={`border-2 rounded-xl p-8 relative transition-all flex flex-col ${
              currentPlan === 'Premium' ? 'border-green-500 bg-gradient-to-br from-green-50 to-white' : 'border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/30'
            } hover:border-amber-600 hover:-translate-y-1 hover:shadow-xl`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                RECOMMENDED
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Premium</h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-xl font-semibold text-amber-600">₹</span>
                  <span className="text-4xl font-bold text-amber-600 mx-1">868.61</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600">Unlock your full potential with advanced tools and premium support.</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>All basic features</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Ad-free experience</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Advanced tools</span>
                </li>
              </ul>

              <button
                className={`w-full px-6 py-3.5 rounded-lg text-base font-semibold transition-all ${
                  currentPlan === 'Premium'
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)]'
                }`}
                onClick={currentPlan === 'Basic' ? handleUpgradeToPremium : null}
                disabled={currentPlan === 'Premium' || loading}
              >
                {currentPlan === 'Premium' ? 'Current Plan' : loading ? 'Processing...' : 'Upgrade to Premium'}
              </button>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <i className="fas fa-info-circle text-blue-600"></i>
            Billing Information
          </h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-gray-700 text-sm">
              <i className="fas fa-shield-alt text-green-600 w-5 text-center"></i>
              Secure payment processing
            </li>
            <li className="flex items-center gap-3 text-gray-700 text-sm">
              <i className="fas fa-sync-alt text-green-600 w-5 text-center"></i>
              Cancel or change plans anytime
            </li>
            <li className="flex items-center gap-3 text-gray-700 text-sm">
              <i className="fas fa-calendar text-green-600 w-5 text-center"></i>
              Monthly billing cycles
            </li>
            <li className="flex items-center gap-3 text-gray-700 text-sm">
              <i className="fas fa-headset text-green-600 w-5 text-center"></i>
              24/7 customer support for Premium users
            </li>
          </ul>
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
