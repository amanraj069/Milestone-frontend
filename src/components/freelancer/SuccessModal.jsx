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
      className={`fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-[60] transition-opacity duration-220 ${
        closing ? 'animate-[appOverlayOut_180ms_ease-in_forwards]' : 'animate-[appOverlayIn_220ms_ease-out_forwards]'
      }`}
      onClick={handleClose}
      style={{ opacity: closing ? undefined : 0 }}
    >
      <div
        className={`bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transition-all duration-260 ${
          closing ? 'animate-[appPanelOut_180ms_ease-in_forwards]' : 'animate-[appPanelIn_260ms_ease-out_forwards]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: closing ? undefined : 'translateY(10px) scale(0.995)',
          opacity: closing ? undefined : 0,
        }}
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check-circle text-green-600 text-5xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Success!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
          <button
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            onClick={handleClose}
          >
            Close
          </button>
        </div>

        <style>{`
          @keyframes appOverlayIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes appOverlayOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes appPanelIn {
            from {
              transform: translateY(10px) scale(0.995);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          @keyframes appPanelOut {
            from {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            to {
              transform: translateY(10px) scale(0.995);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SuccessModal;
