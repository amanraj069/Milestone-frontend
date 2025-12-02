import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../../components/DashboardPage';
import SuccessModal from './SuccessModal';
import PlanSelectionModal from './PlanSelectionModal';
import PaymentProcessingModal from './PaymentProcessingModal';
import UnsubscribeModal from './UnsubscribeModal';
import { useAuth } from '../../../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { setSubscriptionPlan, resetSubscription } from '../../../store/slices/subscriptionSlice';
import './Subscription.css';

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

  const content = (
    <div className="subscription-container">
      
      {/* Current Plan Banner */}
      <div className={`current-plan-banner ${currentPlan.toLowerCase()}`}>
        <div className="current-plan-content">
          <i className="fas fa-crown"></i>
          <div>
            <h2>Your Current Plan</h2>
            <p className="plan-name">
              {currentPlan} {currentDuration && currentDuration === 12 ? '(12 months)' : currentDuration ? `(${currentDuration} month${currentDuration > 1 ? 's' : ''})` : ''} - {currentPlan === 'Basic' ? 'Includes basic features. Upgrade for more!' : 'Premium features unlocked'}
            </p>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="plans-section">
        <h2 className="section-title">Choose Your Plan</h2>
        
        <div className="plans-grid">
          {/* Basic Plan */}
          <div className={`plan-card ${currentPlan === 'Basic' ? 'current' : ''}`}>
            <div className="plan-header">
              <h3 className="plan-title">Basic</h3>
              <div className="plan-price">
                <span className="currency">₹</span>
                <span className="amount">0</span>
                <span className="period">/month</span>
              </div>
              <p className="plan-description">
                Perfect for getting started with basic functionality and essential features.
              </p>
            </div>

            <ul className="plan-features">
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Core functionality</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Limited project access</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Basic support</span>
              </li>
              <li className="feature-item not-included">
                <i className="fas fa-times"></i>
                <span>Ads included</span>
              </li>
            </ul>

            <button
              className={`plan-button ${currentPlan === 'Basic' ? 'current' : 'secondary'}`}
              onClick={currentPlan === 'Premium' ? handleDowngradeClick : null}
              disabled={currentPlan === 'Basic' || loading}
            >
              {currentPlan === 'Basic' ? 'Current Plan' : loading ? 'Processing...' : 'Downgrade to Basic'}
            </button>
          </div>

          {/* Premium Plan */}
          <div className={`plan-card premium ${currentPlan === 'Premium' ? 'current' : ''}`}>
            <div className="recommended-badge">RECOMMENDED</div>
            <div className="plan-header">
              <h3 className="plan-title">Premium</h3>
              <div className="plan-price">
                <span className="currency">₹</span>
                <span className="amount">868.61</span>
                <span className="period">/month</span>
              </div>
              <p className="plan-description">
                Unlock your full potential with advanced tools and premium support.
              </p>
            </div>

            <ul className="plan-features">
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>All basic features</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Unlimited projects</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Advanced analytics</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Priority support</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Ad-free experience</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Advanced tools</span>
              </li>
            </ul>

            <button
              className={`plan-button ${currentPlan === 'Premium' ? 'current' : 'primary'}`}
              onClick={currentPlan === 'Basic' ? handleUpgradeToPremium : null}
              disabled={currentPlan === 'Premium' || loading}
            >
              {currentPlan === 'Premium' ? 'Current Plan' : loading ? 'Processing...' : 'Upgrade to Premium'}
            </button>
          </div>
        </div>
      </div>

      {/* Billing Information */}
      <div className="billing-info">
        <h3>
          <i className="fas fa-info-circle"></i> Billing Information
        </h3>
        <ul>
          <li>
            <i className="fas fa-shield-alt"></i>
            Secure payment processing
          </li>
          <li>
            <i className="fas fa-sync-alt"></i>
            Cancel or change plans anytime
          </li>
          <li>
            <i className="fas fa-calendar"></i>
            Monthly billing cycles
          </li>
          <li>
            <i className="fas fa-headset"></i>
            24/7 customer support for Premium users
          </li>
        </ul>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        message={modalMessage}
      />

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        isOpen={showPlanSelectionModal}
        onClose={() => setShowPlanSelectionModal(false)}
        onSelectPlan={handlePlanSelection}
      />

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={showPaymentProcessing}
        onComplete={handlePaymentComplete}
      />

      {/* Unsubscribe Modal */}
      <UnsubscribeModal
        isOpen={showUnsubscribeModal}
        onClose={() => setShowUnsubscribeModal(false)}
        onConfirm={handleConfirmDowngrade}
      />
    </div>
  );

  return <DashboardPage title="Subscription">{content}</DashboardPage>;
};

export default FreelancerSubscription;
