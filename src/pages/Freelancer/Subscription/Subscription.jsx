import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../../components/DashboardPage';
import SuccessModal from './SuccessModal';
import { useAuth } from '../../../context/AuthContext';
import './Subscription.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const FreelancerSubscription = () => {
  const { user, checkAuthStatus } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('Basic');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (user?.subscription) {
      setCurrentPlan(user.subscription);
    }
  }, [user]);

  const handleUpgradeToPremium = async () => {
    if (loading) return;

    const confirmed = window.confirm(
      'Upgrade to Premium Plan for ₹868.61/month?\n\nYou will get:\n• Unlimited projects\n• Advanced analytics\n• Priority support\n• Ad-free experience\n• Advanced tools'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/freelancer/upgrade_subscription`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh user data from backend to get updated subscription
        await checkAuthStatus();
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

  const handleDowngradeToBasic = async () => {
    if (loading) return;

    const confirmed = window.confirm(
      'Downgrade to Basic Plan (Free)?\n\nYou will lose:\n• Unlimited projects\n• Advanced analytics\n• Priority support\n• Ad-free experience\n• Advanced tools'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/freelancer/downgrade_subscription`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh user data from backend to get updated subscription
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
              {currentPlan} - {currentPlan === 'Basic' ? 'Includes basic features. Upgrade for more!' : 'Premium features unlocked'}
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
              onClick={currentPlan === 'Premium' ? handleDowngradeToBasic : null}
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
    </div>
  );

  return <DashboardPage title="Subscription">{content}</DashboardPage>;
};

export default FreelancerSubscription;
