import React, { useState } from 'react';
import loadRazorpay from '../../utils/loadRazorpay';
import RazorpayIcon from '../RazorpayIcon';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const PlanSelectionModal = ({ isOpen, onClose, onSelectPlan, userType }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [closing, setClosing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  // Pricing based on user type
  const plans = userType === 'Employer' ? [
    {
      id: '3months',
      duration: '3 Months',
      monthlyPrice: 868,
      totalPrice: 2604,
      discount: 0,
      savings: 0,
    },
    {
      id: '9months',
      duration: '9 Months',
      monthlyPrice: 780,
      totalPrice: 7020,
      discount: 10,
      savings: 792,
      popular: true,
    },
    {
      id: '1year',
      duration: '12 months',
      monthlyPrice: 650,
      totalPrice: 7800,
      discount: 25,
      savings: 2616,
      bestValue: true,
    },
  ] : [
    {
      id: '3months',
      duration: '3 Months',
      monthlyPrice: 869,
      totalPrice: 2607,
      discount: 0,
      savings: 0,
    },
    {
      id: '9months',
      duration: '9 Months',
      monthlyPrice: 782,
      totalPrice: 7038,
      discount: 10,
      savings: 783,
      popular: true,
    },
    {
      id: '1year',
      duration: '12 months',
      monthlyPrice: 651,
      totalPrice: 7812,
      discount: 25,
      savings: 2616,
      bestValue: true,
    },
  ];

  const handleClose = () => {
    if (paying) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setShowPaymentStep(false);
      setSelectedPlan(null);
      setPayError('');
      onClose();
    }, 180);
  };

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

  // Razorpay checkout flow
  const handleRazorpayPayment = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setPaying(true);
    setPayError('');

    try {
      // 1. Load Razorpay SDK
      await loadRazorpay();

      // 2. Create order on backend (amount in paise)
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

      // 3. Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Milestone',
        description: `Premium ${plan.duration} Plan`,
        order_id: orderData.orderId,
        handler: async (response) => {
          // 4. Verify payment on backend
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
              const numericDuration = parseInt(plan.duration);
              onSelectPlan({
                plan: selectedPlan,
                duration: numericDuration,
                durationText: plan.duration,
                totalPrice: plan.totalPrice,
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
        theme: { color: '#2563eb' },
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

  if (!isOpen) return null;

  const activePlan = plans.find(p => p.id === selectedPlan);

  return (
    <div
      className={`fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-[60] transition-opacity duration-220 ${
        closing ? 'animate-[appOverlayOut_180ms_ease-in_forwards]' : 'animate-[appOverlayIn_220ms_ease-out_forwards]'
      }`}
      onClick={handleClose}
      style={{ opacity: closing ? undefined : 0 }}
    >
      <div
        className={`bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-260 ${
          closing ? 'animate-[appPanelOut_180ms_ease-in_forwards]' : 'animate-[appPanelIn_260ms_ease-out_forwards]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: closing ? undefined : 'translateY(10px) scale(0.995)',
          opacity: closing ? undefined : 0,
        }}
      >
        <button
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          onClick={handleClose}
        >
          <i className="fas fa-times text-gray-600"></i>
        </button>

        <div className="p-8">
          {!showPaymentStep ? (
            <>
              <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Choose Your Plan Duration</h2>
              <p className="text-gray-600 mb-8 text-center">Select the plan that works best for you</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${
                      plan.bestValue ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50' : 
                      plan.popular ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50' : 
                      'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {plan.bestValue && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                        BEST VALUE
                      </div>
                    )}
                    {plan.popular && !plan.bestValue && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full">
                        POPULAR
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <div className="text-xl font-bold text-gray-800 mb-3">{plan.duration}</div>
                      <div className="mb-2">
                        <span className="text-3xl font-bold text-blue-600">₹{plan.monthlyPrice}</span>
                        <span className="text-gray-500 text-sm">/month</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Total: <span className="font-semibold">₹{plan.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    {plan.discount > 0 && (
                      <div className="bg-green-100 border border-green-300 rounded-lg p-2 mb-4 text-center">
                        <i className="fas fa-tag text-green-600 mr-2"></i>
                        <span className="text-green-700 font-semibold text-sm">
                          Save {plan.discount}% (₹{plan.savings})
                        </span>
                      </div>
                    )}

                    <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2">
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
                className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                onClick={handleBack}
                disabled={paying}
              >
                <i className="fas fa-arrow-left"></i> Back to Plans
              </button>

              <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Confirm & Pay</h2>

              {/* Selected plan summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-blue-600"></i>
                    <span className="font-semibold text-gray-800">Premium — {activePlan?.duration}</span>
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
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <i className="fas fa-shield-alt text-green-600"></i>
                  Payments are securely processed by Razorpay
                </div>
                {/* Test credentials hint */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  <p className="font-semibold mb-1">Test Mode — Use these credentials:</p>
                  <p>UPI (recommended): <code className="bg-amber-100 px-1 rounded">success@razorpay</code></p>
                  <p>Card: <code className="bg-amber-100 px-1 rounded">5104 0155 5555 5558</code>, any CVV, any future expiry</p>
                </div>
              </div>
            </>
          )}
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

export default PlanSelectionModal;
