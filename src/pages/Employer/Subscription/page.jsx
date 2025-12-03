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
                <p className="text-sm text-gray-600">Perfect for getting started with basic job posting features.</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Post up to 3 jobs per month</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Basic applicant management</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Standard support</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-400 line-through">
                  <i className="fas fa-times text-red-500 w-5 text-center"></i>
                  <span>Priority listing</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-400 line-through">
                  <i className="fas fa-times text-red-500 w-5 text-center"></i>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-400 line-through">
                  <i className="fas fa-times text-red-500 w-5 text-center"></i>
                  <span>Premium support</span>
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
                POPULAR
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Premium</h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-xl font-semibold text-amber-600">₹</span>
                  <span className="text-4xl font-bold text-amber-600 mx-1">868</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600">Ideal for growing businesses with advanced hiring needs.</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Unlimited job postings</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Advanced applicant filtering</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Priority job listing</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Detailed analytics & insights</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Premium support (24/7)</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-800">
                  <i className="fas fa-check text-green-600 w-5 text-center"></i>
                  <span>Custom branding options</span>
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
      <PlanSelectionModal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} onSelectPlan={handlePlanSelection} userType="Employer" />
      <UnsubscribeModal isOpen={showUnsubscribeModal} onClose={() => setShowUnsubscribeModal(false)} onConfirm={handleConfirmDowngrade} loading={loading} />
      <PaymentProcessingModal isOpen={showPaymentProcessing} onComplete={handlePaymentComplete} />
    </DashboardPage>
  );
};

export default EmployerSubscription;
export { EmployerSubscription };
