import React, { useEffect } from 'react';
import './PaymentProcessingModal.css';

const PaymentProcessingModal = ({ isOpen, onComplete }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onComplete();
      }, 4000); // Show animation for 4 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-payment">
      <div className="modal-content-payment">
        <div className="payment-animation">
          <div className="loader-container">
            <div className="checkmark-static draw"></div>
            <div className="circle-loader"></div>
          </div>
        </div>
        
        <h2 className="payment-title">Processing Payment</h2>
        <p className="payment-subtitle">Please wait while we process your payment...</p>
        
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="security-badge-payment">
          <i className="fas fa-lock"></i>
          Secure Payment
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingModal;
