import React, { useEffect } from 'react';

const PaymentProcessingModal = ({ isOpen, onComplete }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onComplete();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70]">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center">
          {/* Animated Loader */}
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 animate-[checkmarkFadeIn_0.5s_ease-in_2s_forwards]">
              <i className="fas fa-check text-green-600 text-4xl"></i>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h2>
          <p className="text-gray-600 mb-6 text-center">Please wait while we process your payment...</p>
          
          <div className="flex gap-2 mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-gray-600">
            <i className="fas fa-lock text-green-600"></i>
            Secure Payment
          </div>
        </div>

        <style>{`
          @keyframes checkmarkFadeIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PaymentProcessingModal;
