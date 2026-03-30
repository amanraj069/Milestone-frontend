import React, { useState } from 'react';
import loadRazorpay from '../../utils/loadRazorpay';
import RazorpayIcon from '../RazorpayIcon';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const FeePaymentModal = ({ isOpen, onClose, onConfirm, fees, budget, isBoosted }) => {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  if (!isOpen) return null;

  const feeAmount = fees.platformFeeAmount;
  const isFree = feeAmount === 0;

  const handleClose = () => {
    if (paying) return;
    setPayError('');
    onClose();
  };

  // Razorpay checkout flow for platform fee
  const handleRazorpayPayment = async () => {
    setPaying(true);
    setPayError('');

    try {
      await loadRazorpay();

      // Amount in paise — round to avoid floating point issues
      const amountInPaise = Math.round(feeAmount * 100);

      const orderRes = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          paymentType: 'platform_fee',
          metadata: {
            isBoosted: isBoosted || false,
            feeRate: fees.totalFeeRate,
            feeAmount: feeAmount,
          },
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      const razorpayKey = orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Payment configuration is missing. Please contact support.');
      }

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Milestone',
        description: `Platform Fee — ₹${feeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              onConfirm({
                razorpayPaymentId: verifyData.paymentId,
                razorpayOrderId: response.razorpay_order_id,
              });
            } else {
              setPayError(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            setPayError(err.message || 'Verification request failed');
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
        theme: { color: isBoosted ? '#d97706' : '#4f46e5' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setPayError(resp.error?.description || 'Payment failed. Please try again.');
        setPaying(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      setPayError(error.message || 'Something went wrong');
      setPaying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-[1000] animate-[fadeIn_300ms_ease]"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl p-10 max-w-lg w-[90%] max-h-[90vh] overflow-y-auto relative animate-[slideUp_400ms_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-5 right-5 bg-transparent border-none text-2xl text-gray-600 cursor-pointer transition-all w-10 h-10 flex items-center justify-center rounded-full hover:text-black hover:bg-gray-100"
          onClick={handleClose}
        >
          <i className="fas fa-times" />
        </button>

        {/* Header */}
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Platform Fee Payment</h2>
        <p className="text-base text-gray-600 text-center mb-8">Secure · Encrypted · Instant activation</p>

        {/* Fee summary */}
        <div className={`px-5 py-4 rounded-xl mb-6 text-base font-semibold flex flex-col gap-2 ${isBoosted ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-900'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isBoosted ? 'text-amber-500' : 'text-indigo-500'}`}>
            Fee Breakdown
          </p>
          <div className="flex justify-between items-center text-sm font-normal">
            <span className="text-gray-600">Platform fee</span>
            <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${isBoosted ? 'bg-amber-200 text-amber-800' : 'bg-indigo-200 text-indigo-800'}`}>
              {fees.platformFeeRate}% {isBoosted ? '(boosted)' : '(standard)'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-normal">
            <span className="text-gray-600">Application cap fee</span>
            <span className="font-semibold text-gray-700 text-xs">{fees.applicationCapFeeRate}%</span>
          </div>
          <div className={`border-t pt-2 mt-1 flex justify-between items-center ${isBoosted ? 'border-amber-300' : 'border-indigo-300'}`}>
            <span>Total ({fees.totalFeeRate}% of ₹{Number(budget).toLocaleString('en-IN')})</span>
            <span className={`text-xl font-extrabold ${isBoosted ? 'text-orange-600' : 'text-indigo-700'}`}>
              {isFree ? 'Free' : `₹${feeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          {isBoosted && (
            <div className="mt-2 pt-2 border-t border-amber-300 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Boost includes</p>
              <div className="flex items-center gap-2 text-xs text-amber-700 font-normal">
                <i className="fas fa-check-circle text-amber-500 text-[11px]" /> Lifetime boost — active for full job duration
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-700 font-normal">
                <i className="fas fa-check-circle text-amber-500 text-[11px]" /> Top placement above all standard &amp; premium listings
              </div>
            </div>
          )}
        </div>

        {/* Free tier */}
        {isFree ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3.5 text-sm text-green-800">
              <i className="fas fa-check-circle text-green-500 text-base shrink-0" />
              <p>No payment required — your selected cap tier has a 0% fee.</p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3.5 border-2 border-gray-300 rounded-xl text-gray-600 font-semibold text-base hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => onConfirm(null)}
                className="flex-[2] px-4 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none rounded-xl text-base font-bold cursor-pointer transition-all flex items-center justify-center gap-2 hover:scale-105 hover:shadow-[0_8px_24px_rgba(16,185,129,0.4)]"
              >
                <i className="fas fa-check" /> Confirm &amp; Publish
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            {/* Error message */}
            {payError && (
              <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <i className="fas fa-exclamation-circle shrink-0" />
                <span>{payError}</span>
                <button onClick={() => setPayError('')} className="ml-auto text-red-400 hover:text-red-600">
                  <i className="fas fa-times" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={paying}
                className="flex-1 px-4 py-3.5 border-2 border-gray-300 rounded-xl text-gray-600 font-semibold text-base hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={paying}
                className="flex-[2] px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all flex items-center justify-center gap-3 hover:scale-105 hover:shadow-[0_8px_24px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {paying ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Processing…
                  </>
                ) : (
                  <>
                    <RazorpayIcon className="w-5 h-5" />
                    Pay ₹{feeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} with Razorpay
                  </>
                )}
              </button>
            </div>

            {/* Security & test credentials */}
            <div className="mt-5 space-y-3">
              <div className="text-center text-gray-600 text-sm flex items-center justify-center gap-2">
                <i className="fas fa-shield-alt text-green-600" />
                Payments are securely processed by Razorpay
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <p className="font-semibold mb-1">Test Mode — Use these credentials:</p>
                <p>UPI (recommended): <code className="bg-amber-100 px-1 rounded">success@razorpay</code></p>
                <p>Card: <code className="bg-amber-100 px-1 rounded">5104 0155 5555 5558</code>, any CVV, any future expiry</p>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>
  );
};

export default FeePaymentModal;
