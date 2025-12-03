import React, { useEffect, useState } from 'react';

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
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] transition-opacity duration-220 ${
        closing ? 'animate-[fadeOut_180ms_ease-in]' : 'animate-[fadeIn_220ms_ease-out]'
      }`}
      onClick={handleClose}
      style={{ opacity: closing ? 0 : 1 }}
    >
      <div
        className={`bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl transition-all duration-260 ${
          closing ? 'animate-[slideOut_180ms_ease-in]' : 'animate-[slideIn_260ms_ease-out]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: closing ? 'translateY(-20px) scale(0.95)' : 'translateY(0) scale(1)',
          opacity: closing ? 0 : 1,
        }}
      >
        <div className="mb-6">
          <i className="fas fa-check-circle text-6xl text-green-500"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Success!</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
          onClick={handleClose}
        >
          Close
        </button>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes slideIn {
            from {
              transform: translateY(-20px) scale(0.95);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          @keyframes slideOut {
            from {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            to {
              transform: translateY(-20px) scale(0.95);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SuccessModal;
