import React from 'react';

const UnsubscribeModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-[slideUp_300ms_ease]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-3xl text-amber-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Are you sure you want to unsubscribe?</h2>
          <div className="text-gray-600 font-medium mb-4">You will lose all premium benefits:</div>

          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-4">
            <span className="flex items-center gap-2"><i className="fas fa-times text-red-500"></i> Unlimited job postings</span>
            <span className="flex items-center gap-2"><i className="fas fa-times text-red-500"></i> Advanced filtering</span>
            <span className="flex items-center gap-2"><i className="fas fa-times text-red-500"></i> Priority listing</span>
            <span className="flex items-center gap-2"><i className="fas fa-times text-red-500"></i> Analytics</span>
            <span className="flex items-center gap-2"><i className="fas fa-times text-red-500"></i> 24/7 Support</span>
            <span className="flex items-center gap-2"><i className="fas fa-times text-red-500"></i> Custom branding</span>
          </div>

          <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 justify-center">
            <i className="fas fa-info-circle"></i>
            You can always upgrade again later
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={loading}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Keep Premium
          </button>
          <button 
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-check mr-2"></i>
                Unsubscribe
              </>
            )}
          </button>
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default UnsubscribeModal;
