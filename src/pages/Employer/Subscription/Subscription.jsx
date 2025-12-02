import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../../components/DashboardPage';
import SuccessModal from './SuccessModal';
import PlanSelectionModal from './PlanSelectionModal';
import UnsubscribeModal from './UnsubscribeModal';
import PaymentProcessingModal from './PaymentProcessingModal';
import { useAuth } from '../../../context/AuthContext';
import { setSubscriptionPlan, resetSubscription } from '../../../redux/slices/subscriptionSlice';
import './Subscription.css';

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
      
      // Store plan data for later use
      setSelectedPlanData(planData);
      
      // Simulate payment processing
      // In production, this would call a payment gateway API
      
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
        // Update Redux state
        dispatch(setSubscriptionPlan({
          plan: 'Premium',
          duration: selectedPlanData.duration,
          expiryDate: response.data.expiryDate,
        }));

        // Refresh user data
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
        // Reset Redux state
        dispatch(resetSubscription());
        
        // Refresh user data
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
                Perfect for getting started with basic job posting features.
              </p>
            </div>

            <ul className="plan-features">
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Post up to 3 jobs per month</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Basic applicant management</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Standard support</span>
              </li>
              <li className="feature-item not-included">
                <i className="fas fa-times"></i>
                <span>Priority listing</span>
              </li>
              <li className="feature-item not-included">
                <i className="fas fa-times"></i>
                <span>Advanced analytics</span>
              </li>
              <li className="feature-item not-included">
                <i className="fas fa-times"></i>
                <span>Premium support</span>
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
            <div className="recommended-badge">POPULAR</div>
            <div className="plan-header">
              <h3 className="plan-title">Premium</h3>
              <div className="plan-price">
                <span className="currency">₹</span>
                <span className="amount">868</span>
                <span className="period">/month</span>
              </div>
              <p className="plan-description">
                Ideal for growing businesses with advanced hiring needs.
              </p>
            </div>

            <ul className="plan-features">
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Unlimited job postings</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Advanced applicant filtering</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Priority job listing</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Detailed analytics & insights</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Premium support (24/7)</span>
              </li>
              <li className="feature-item included">
                <i className="fas fa-check"></i>
                <span>Custom branding options</span>
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
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSelectPlan={handlePlanSelection}
        userType="Employer"
      />

      {/* Unsubscribe Confirmation Modal */}
      <UnsubscribeModal
        isOpen={showUnsubscribeModal}
        onClose={() => setShowUnsubscribeModal(false)}
        onConfirm={handleConfirmDowngrade}
        loading={loading}
      />

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={showPaymentProcessing}
        onComplete={handlePaymentComplete}
      />
    </div>
  );

  return <DashboardPage title="Subscription">{content}</DashboardPage>
};

export default EmployerSubscription;
