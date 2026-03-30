import React, { useState } from 'react';
import loadRazorpay from '../../utils/loadRazorpay';
import RazorpayIcon from '../RazorpayIcon';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

/* ─────────────────────────────────────────────────
   Fee helpers — mirror server-side logic exactly
───────────────────────────────────────────────── */
export const computeCapFeeRate = (applicationCap) => {
  if (applicationCap === null || applicationCap === undefined) return 2;
  const cap = parseInt(applicationCap);
  if (cap <= 10) return 0;
  if (cap <= 25) return 0.5;
  if (cap <= 50) return 1;
  return 2;
};

export const computeFees = (budget, isBoosted, applicationCap) => {
  const platformFeeRate = isBoosted ? 4 : 2;
  const applicationCapFeeRate = computeCapFeeRate(applicationCap);
  const totalFeeRate = platformFeeRate + applicationCapFeeRate;
  const platformFeeAmount = parseFloat(((totalFeeRate / 100) * parseFloat(budget || 0)).toFixed(2));
  return { platformFeeRate, applicationCapFeeRate, totalFeeRate, platformFeeAmount };
};

/* ─────────────────────────────────────────────────
   Main modal
───────────────────────────────────────────────── */
const BoostJobModal = ({ job, isOpen, onClose, onSuccess, apiBaseUrl }) => {
  const [step, setStep] = useState('info'); // 'info' | 'payment' | 'processing' | 'done'
  const [serverError, setServerError] = useState('');
  const [paying, setPaying] = useState(false);

  if (!isOpen || !job) return null;

  const fees = computeFees(job.budget, true, job.applicationCap);

  // Razorpay checkout → verify → call boost API
  const handleRazorpayPayment = async () => {
    setPaying(true);
    setServerError('');

    try {
      await loadRazorpay();

      const amountInPaise = Math.round(fees.platformFeeAmount * 100);

      const orderRes = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          paymentType: 'boost',
          metadata: {
            jobId: job.jobId,
            feeRate: fees.totalFeeRate,
            feeAmount: fees.platformFeeAmount,
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
        description: `Boost — ${job.title}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Verify payment
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

            if (!verifyRes.ok || !verifyData.success) {
              setServerError(verifyData.message || 'Payment verification failed');
              setPaying(false);
              return;
            }

            // Payment verified — now activate boost on backend
            setStep('processing');
            const boostRes = await fetch(
              `${apiBaseUrl}/api/employer/job-listings/${job.jobId}/boost`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  paymentDetails: {
                    razorpayPaymentId: verifyData.paymentId,
                    razorpayOrderId: response.razorpay_order_id,
                  },
                }),
              }
            );
            const boostData = await boostRes.json();

            if (boostRes.ok && boostData.success) {
              setStep('done');
              setTimeout(() => onSuccess(boostData.data ?? boostData), 1800);
            } else {
              setStep('payment');
              setServerError(boostData.error || 'Boost activation failed.');
            }
          } catch (err) {
            setStep('payment');
            setServerError(err.message || 'Something went wrong');
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
        theme: { color: '#d97706' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setServerError(resp.error?.description || 'Payment failed. Please try again.');
        setPaying(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      setServerError(error.message || 'Something went wrong');
      setPaying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,10,20,0.72)', backdropFilter: 'blur(5px)' }}
      onClick={step !== 'processing' && step !== 'done' && !paying ? onClose : undefined}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

        {/* Close button */}
        {step !== 'processing' && step !== 'done' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all text-sm"
          >
            <i className="fas fa-times" />
          </button>
        )}

        <div className="p-8">

          {/* ╔══════════════ INFO ══════════════╗ */}
          {step === 'info' && (
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg shadow-lg shadow-orange-200">
                  <i className="fas fa-bolt" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-gray-900 leading-tight">Boost Job Listing</h2>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{job.title}</p>
                </div>
              </div>

              {/* Already boosted warning */}
              {job.isBoosted ? (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 text-sm text-amber-800">
                  <i className="fas fa-info-circle mt-0.5 flex-shrink-0 text-amber-500" />
                  <p>
                    This listing is <strong>already boosted</strong> for its full lifetime. Boost cannot be applied twice.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 leading-relaxed">
                  Boosting places this listing at the top of all job search results for the <strong className="text-gray-700">entire duration of the posting</strong>. The one-time fee is charged at the time of boosting.
                </p>
              )}

              {/* Fee summary */}
              <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-2xl px-6 py-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-orange-400 mb-1">One-time boost fee</p>
                  <p className="text-3xl font-extrabold text-gray-900 leading-none">
                    ₹{fees.platformFeeAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {fees.totalFeeRate}% of ₹{Number(job.budget).toLocaleString('en-IN')} budget
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Platform fee</p>
                  <p className="text-sm font-bold text-gray-700 font-mono">4%</p>
                  {fees.applicationCapFeeRate > 0 && (
                    <>
                      <p className="text-xs text-gray-400 mt-2 mb-1">Cap fee</p>
                      <p className="text-sm font-bold text-gray-700 font-mono">{fees.applicationCapFeeRate}%</p>
                    </>
                  )}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => { setStep('payment'); setServerError(''); }}
                disabled={job.isBoosted}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-base hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <i className="fas fa-bolt mr-2" />
                {job.isBoosted
                  ? 'Already Boosted'
                  : `Boost for ₹${fees.platformFeeAmount.toLocaleString('en-IN')}`}
              </button>
            </div>
          )}

          {/* ╔══════════════ PAYMENT ══════════════╗ */}
          {step === 'payment' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('info')}
                  disabled={paying}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all text-sm flex-shrink-0 disabled:opacity-50"
                >
                  <i className="fas fa-arrow-left" />
                </button>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Confirm & Pay</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Secure · Powered by Razorpay</p>
                </div>
              </div>

              {/* Amount pill */}
              <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-0.5">
                    Boost fee
                  </p>
                  <p className="text-2xl font-extrabold text-gray-900 leading-none">
                    ₹{fees.platformFeeAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {fees.totalFeeRate}% of ₹{Number(job.budget).toLocaleString('en-IN')} budget
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl shadow-md">
                  <i className="fas fa-bolt" />
                </div>
              </div>

              {serverError && (
                <div className="flex items-center gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <i className="fas fa-exclamation-circle text-red-400 flex-shrink-0" />
                  <span className="flex-1">{serverError}</span>
                  <button onClick={() => setServerError('')} className="text-red-400 hover:text-red-600">
                    <i className="fas fa-times" />
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  disabled={paying}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={paying}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Processing…
                    </>
                  ) : (
                    <>
                      <RazorpayIcon className="w-4 h-4" />
                      Pay & Activate Boost
                    </>
                  )}
                </button>
              </div>

              {/* Security & test credentials */}
              <div className="space-y-2">
                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                  <i className="fas fa-shield-alt text-gray-300" />
                  Payments are securely processed by Razorpay
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  <p className="font-semibold mb-1">Test Mode — Use these credentials:</p>
                  <p>UPI (recommended): <code className="bg-amber-100 px-1 rounded">success@razorpay</code></p>
                  <p>Card: <code className="bg-amber-100 px-1 rounded">5104 0155 5555 5558</code>, any CVV, any future expiry</p>
                </div>
              </div>
            </div>
          )}

          {/* ╔══════════════ PROCESSING ══════════════╗ */}
          {step === 'processing' && (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-bolt text-2xl text-orange-400" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-extrabold text-gray-900">Activating Boost</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Payment verified — updating your listing…
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ╔══════════════ DONE ══════════════╗ */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-3xl shadow-lg shadow-green-200">
                <i className="fas fa-check" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-extrabold text-gray-900">Boost Activated!</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                  <span className="font-semibold text-gray-700">{job.title}</span> is now placed at
                  the top of all job listings for its entire active lifetime.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {['Top placement', 'Full lifetime boost', 'Max candidate reach'].map((l) => (
                  <span
                    key={l}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium"
                  >
                    <i className="fas fa-check-circle mr-1 text-green-400" />
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BoostJobModal;
