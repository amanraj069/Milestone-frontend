import React, { useEffect, useState } from 'react';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, message }) => {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 180);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`success-modal-overlay ${closing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`success-modal-content ${closing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="success-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <h2>Success!</h2>
        <p>{message}</p>
        <button className="success-modal-button" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
