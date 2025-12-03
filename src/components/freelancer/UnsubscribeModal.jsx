import React, { useState } from 'react';

const UnsubscribeModal = ({ isOpen, onClose, onConfirm, loading }) => {
  const [closing, setClosing] = useState(false);

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
        className={`bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl transition-all duration-260 ${
          closing ? 'animate-[appPanelOut_180ms_ease-in_forwards]' : 'animate-[appPanelIn_260ms_ease-out_forwards]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: closing ? undefined : 'translateY(10px) scale(0.995)',
          opacity: closing ? undefined : 0,
        }}
      >
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-amber-600 text-4xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Are you sure you want to unsubscribe?</h2>
          <p className="text-gray-600 font-medium">You will lose all premium benefits:</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <i className="fas fa-times"></i>
            <span>Unlimited projects</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-600">
            <i className="fas fa-times"></i>
            <span>Advanced analytics</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-600">
            <i className="fas fa-times"></i>
            <span>Priority support</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-600">
            <i className="fas fa-times"></i>
            <span>Ad-free experience</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-600">
            <i className="fas fa-times"></i>
            <span>Advanced tools</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-600">
            <i className="fas fa-times"></i>
            <span>Premium features</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm text-blue-700">
          <i className="fas fa-info-circle"></i>
          <span>You can always upgrade again later</span>
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center gap-2"
            onClick={handleClose}
            disabled={loading}
          >
            <i className="fas fa-arrow-left"></i>
            Keep Premium
          </button>
          <button
            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center gap-2"
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

export default UnsubscribeModal;
