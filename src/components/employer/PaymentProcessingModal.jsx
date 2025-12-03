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
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-3xl p-12 max-w-md w-full mx-4 text-center">
        <div className="mb-8">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-3 flex items-center justify-center">
              <i className="fas fa-check text-3xl text-indigo-600 opacity-0 animate-[fadeIn_500ms_ease-in_2s_forwards]"></i>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
        <p className="text-gray-600 mb-6">Please wait while we process your payment...</p>
        
        <div className="flex justify-center gap-2 mb-8">
          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
        </div>

        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center justify-center gap-2">
          <i className="fas fa-lock"></i>
          Secure Payment
        </div>

        <style>{`
          @keyframes fadeIn {
            to { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PaymentProcessingModal;
