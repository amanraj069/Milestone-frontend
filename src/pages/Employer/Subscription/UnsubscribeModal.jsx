import React from 'react';
import './UnsubscribeModal.css';

const UnsubscribeModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-unsubscribe" onClick={onClose}>
      <div className="modal-content-unsubscribe" onClick={(e) => e.stopPropagation()}>
        <div className="warning-icon-unsubscribe">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        
        <h2 className="modal-title-unsubscribe">Are you sure you want to unsubscribe?</h2>
        
        <div className="warning-message-unsubscribe">
          You will lose all premium benefits:
        </div>

        <div className="benefits-compact-unsubscribe">
          <span><i className="fas fa-times"></i> Unlimited job postings</span>
          <span><i className="fas fa-times"></i> Advanced filtering</span>
          <span><i className="fas fa-times"></i> Priority listing</span>
          <span><i className="fas fa-times"></i> Analytics</span>
          <span><i className="fas fa-times"></i> 24/7 Support</span>
          <span><i className="fas fa-times"></i> Custom branding</span>
        </div>

        <div className="note-unsubscribe">
          <i className="fas fa-info-circle"></i>
          You can always upgrade again later
        </div>

        <div className="actions-unsubscribe">
          <button 
            className="btn-cancel-unsubscribe" 
            onClick={onClose}
            disabled={loading}
          >
            <i className="fas fa-arrow-left"></i>
            Keep Premium
          </button>
          <button 
            className="btn-confirm-unsubscribe" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Unsubscribe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribeModal;
