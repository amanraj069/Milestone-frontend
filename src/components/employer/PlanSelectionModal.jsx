import React, { useState } from 'react';
import loadRazorpay from '../../utils/loadRazorpay';
import RazorpayIcon from '../RazorpayIcon';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const PlanSelectionModal = ({ isOpen, onClose, onSelectPlan, userType }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  const plans = userType === 'Employer' ? [
    { id: '3months', duration: '3 Months', monthlyPrice: 868, totalPrice: 2604, discount: 0, savings: 0 },
    { id: '9months', duration: '9 Months', monthlyPrice: 780, totalPrice: 7020, discount: 10, savings: 792, popular: true },
    { id: '1year', duration: '12 Months', monthlyPrice: 650, totalPrice: 7800, discount: 25, savings: 2616, bestValue: true },
  ] : [
    { id: '3months', duration: '3 Months', monthlyPrice: 869, totalPrice: 2607, discount: 0, savings: 0 },
    { id: '9months', duration: '9 Months', monthlyPrice: 782, totalPrice: 7038, discount: 10, savings: 783, popular: true },
    { id: '1year', duration: '12 Months', monthlyPrice: 651, totalPrice: 7812, discount: 25, savings: 2616, bestValue: true },
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setShowPaymentStep(true);
    setPayError('');
  };

  const handleBack = () => {
    setShowPaymentStep(false);
    setSelectedPlan(null);
    setPayError('');
  };

  const handleClose = () => {
    if (paying) return;
    setShowPaymentStep(false);
    setSelectedPlan(null);
    setPayError('');
    onClose();
  };

  // Razorpay checkout flow
  const handleRazorpayPayment = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setPaying(true);
    setPayError('');

    try {
      await loadRazorpay();

      const orderRes = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: plan.totalPrice * 100,
          currency: 'INR',
          paymentType: 'subscription',
          metadata: {
            planDuration: parseInt(plan.duration),
            planDurationText: plan.duration,
            planPrice: plan.totalPrice,
          },
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Milestone',
        description: `Premium ${plan.duration} Plan`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              const numericDuration = parseInt(plan.duration);
              onSelectPlan({
                plan: selectedPlan,
                duration: numericDuration,
                durationText: plan.duration,
                totalPrice: plan.totalPrice,
                subscriptionUpgraded: verifyData.subscriptionUpgraded || false,
                paymentDetails: {
                  razorpayPaymentId: verifyData.paymentId,
                  razorpayOrderId: response.razorpay_order_id,
                },
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
        theme: { color: '#4f46e5' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (resp) => {
        setPayError(resp.error?.description || 'Payment failed. Please try again.');
        setPaying(false);
        // Notify backend so the Payment record is marked as failed
        try {
          await fetch(`${BACKEND_URL}/api/payment/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              razorpay_order_id: resp.error?.metadata?.order_id,
              razorpay_payment_id: resp.error?.metadata?.payment_id,
              error_reason: resp.error?.reason,
            }),
          });
        } catch (_) { /* best-effort */ }
      });
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      setPayError(error.message || 'Something went wrong');
      setPaying(false);
    }
  };

  if (!isOpen) return null;

  const activePlan = plans.find(p => p.id === selectedPlan);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[1000] animate-[fadeIn_300ms_ease]" onClick={handleClose}>
      <div className="bg-white rounded-3xl p-10 max-w-4xl w-[90%] max-h-[90vh] overflow-y-auto relative animate-[slideUp_400ms_ease]" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-5 right-5 bg-transparent border-none text-2xl text-gray-600 cursor-pointer transition-all w-10 h-10 flex items-center justify-center rounded-full hover:text-black hover:bg-gray-100" onClick={handleClose}>
          <i className="fas fa-times"></i>
        </button>

        {!showPaymentStep ? (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Choose Your Plan Duration</h2>
            <p className="text-base text-gray-600 text-center mb-8">Select the plan that works best for you</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border-2 rounded-2xl p-6 cursor-pointer transition-all relative ${
                    plan.bestValue ? 'border-green-500 bg-gradient-to-br from-green-50 to-white' : plan.popular ? 'border-amber-500' : 'border-gray-300'
                  } hover:border-indigo-600 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(79,70,229,0.2)]`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.bestValue && <div className="absolute -top-3 right-5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600">BEST VALUE</div>}
                  {plan.popular && !plan.bestValue && <div className="absolute -top-3 right-5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600">POPULAR</div>}
                  
                  <div className="text-xl font-semibold text-gray-900 mb-4">{plan.duration}</div>
                  
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-indigo-600 leading-none">
                      ₹{plan.monthlyPrice}
                      <span className="text-sm text-gray-600 font-normal">/month</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Total: ₹{plan.totalPrice.toLocaleString()}</div>
                  </div>

                  {plan.discount > 0 && (
                    <div className="bg-amber-100 text-amber-900 px-3 py-2 rounded-lg text-sm font-semibold mb-4 flex items-center gap-2">
                      <i className="fas fa-tag"></i>
                      Save {plan.discount}% (₹{plan.savings})
                    </div>
                  )}

                  <button className="w-full px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 hover:scale-105 hover:shadow-[0_4px_12px_rgba(79,70,229,0.4)]">
                    Select Plan
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              className="bg-transparent border-none text-indigo-600 text-sm font-semibold cursor-pointer flex items-center gap-2 mb-6 px-2 py-2 rounded-lg transition-all hover:bg-gray-100"
              onClick={handleBack}
              disabled={paying}
            >
              <i className="fas fa-arrow-left"></i> Back to Plans
            </button>

            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Confirm & Pay</h2>

            {/* Selected plan summary */}
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-5 py-5 rounded-xl mb-6 max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-indigo-600"></i>
                  <span className="font-semibold text-indigo-900">Premium — {activePlan?.duration}</span>
                </div>
                {activePlan?.discount > 0 && (
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {activePlan.discount}% OFF
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900">₹{activePlan?.totalPrice.toLocaleString()}</span>
                <span className="text-sm text-gray-500">total</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">₹{activePlan?.monthlyPrice}/month</p>
            </div>

            {/* Error message */}
            {payError && (
              <div className="max-w-lg mx-auto mb-5 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <i className="fas fa-exclamation-circle shrink-0"></i>
                <span>{payError}</span>
                <button onClick={() => setPayError('')} className="ml-auto text-red-400 hover:text-red-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            {/* Pay button */}
            <div className="max-w-lg mx-auto">
              <button
                onClick={handleRazorpayPayment}
                disabled={paying}
                className="w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all flex items-center justify-center gap-3 hover:scale-105 hover:shadow-[0_8px_24px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                    Pay ₹{activePlan?.totalPrice.toLocaleString()} with Razorpay
                  </>
                )}
              </button>
            </div>

            {/* Security & test credentials */}
            <div className="max-w-lg mx-auto mt-5 space-y-3">
              <div className="text-center text-gray-600 text-sm flex items-center justify-center gap-2">
                <i className="fas fa-shield-alt text-green-600"></i>
                Payments are securely processed by Razorpay
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <p className="font-semibold mb-1">Test Mode — Use these credentials:</p>
                <p>UPI (recommended): <code className="bg-amber-100 px-1 rounded">success@razorpay</code></p>
                <p>Card: <code className="bg-amber-100 px-1 rounded">5104 0155 5555 5558</code>, any CVV, any future expiry</p>
              </div>
            </div>
          </>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PlanSelectionModal;
