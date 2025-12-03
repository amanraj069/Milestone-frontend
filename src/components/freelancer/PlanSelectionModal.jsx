import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const PlanSelectionModal = ({ isOpen, onClose, onSelectPlan, userType }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [closing, setClosing] = useState(false);

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

  const validationSchema = Yup.object({
    cardNumber: Yup.string()
      .matches(/^[0-9]{16}$/, 'Card number must be exactly 16 digits')
      .required('Card number is required'),
    expiryMonth: Yup.string()
      .matches(/^(0[1-9]|1[0-2])$/, 'Invalid month (01-12)')
      .required('Expiry month is required'),
    expiryYear: Yup.string()
      .matches(/^20[2-9][0-9]$/, 'Invalid year')
      .test('not-expired', 'Card has expired', function(value) {
        if (!value) return false;
        const month = this.parent.expiryMonth;
        if (!month) return true;
        const currentDate = new Date();
        const expiryDate = new Date(parseInt(value), parseInt(month) - 1);
        return expiryDate >= currentDate;
      })
      .required('Expiry year is required'),
    cvv: Yup.string()
      .matches(/^[0-9]{3}$/, 'CVV must be exactly 3 digits')
      .required('CVV is required'),
  });

  const formik = useFormik({
    initialValues: {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      const plan = plans.find(p => p.id === selectedPlan);
      const numericDuration = parseInt(plan.duration);
      
      onSelectPlan({
        plan: selectedPlan,
        duration: numericDuration,
        durationText: plan.duration,
        totalPrice: plan.totalPrice,
        paymentDetails: {
          cardNumber: values.cardNumber.slice(-4),
          expiryMonth: values.expiryMonth,
          expiryYear: values.expiryYear,
        },
      });
    },
  });

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setShowPaymentForm(false);
      setSelectedPlan(null);
      formik.resetForm();
      onClose();
    }, 180);
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setShowPaymentForm(true);
  };

  const handleBack = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
    formik.resetForm();
  };

  const getInputClass = (fieldName) => {
    const hasError = formik.touched[fieldName] && formik.errors[fieldName];
    const hasValue = formik.values[fieldName];
    const isValid = formik.touched[fieldName] && !formik.errors[fieldName] && hasValue;
    
    let classes = 'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all';
    
    if (hasError) {
      classes += ' border-red-500 focus:ring-red-200 bg-red-50';
    } else if (isValid) {
      classes += ' border-green-500 focus:ring-green-200 bg-green-50';
    } else {
      classes += ' border-gray-300 focus:ring-blue-200';
    }
    
    return classes;
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
          {!showPaymentForm ? (
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
              >
                <i className="fas fa-arrow-left"></i> Back to Plans
              </button>

              <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Payment Details</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-center gap-2">
                <i className="fas fa-check-circle text-blue-600"></i>
                <span className="font-semibold text-gray-800">
                  {plans.find(p => p.id === selectedPlan)?.duration} Plan - 
                  ₹{plans.find(p => p.id === selectedPlan)?.totalPrice.toLocaleString()}
                </span>
              </div>

              <form onSubmit={formik.handleSubmit} className="max-w-2xl mx-auto space-y-5">
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    id="cardNumber"
                    name="cardNumber"
                    type="text"
                    maxLength="16"
                    placeholder="1234567890123456"
                    className={getInputClass('cardNumber')}
                    value={formik.values.cardNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.cardNumber && formik.errors.cardNumber && (
                    <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <i className="fas fa-exclamation-circle"></i>
                      {formik.errors.cardNumber}
                    </div>
                  )}
                  {formik.touched.cardNumber && !formik.errors.cardNumber && formik.values.cardNumber && (
                    <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                      <i className="fas fa-check-circle"></i>
                      Valid card number
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="expiryMonth" className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiry Month
                    </label>
                    <input
                      id="expiryMonth"
                      name="expiryMonth"
                      type="text"
                      maxLength="2"
                      placeholder="MM"
                      className={getInputClass('expiryMonth')}
                      value={formik.values.expiryMonth}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.expiryMonth && formik.errors.expiryMonth && (
                      <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {formik.errors.expiryMonth}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="expiryYear" className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiry Year
                    </label>
                    <input
                      id="expiryYear"
                      name="expiryYear"
                      type="text"
                      maxLength="4"
                      placeholder="YYYY"
                      className={getInputClass('expiryYear')}
                      value={formik.values.expiryYear}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.expiryYear && formik.errors.expiryYear && (
                      <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {formik.errors.expiryYear}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="cvv" className="block text-sm font-semibold text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      id="cvv"
                      name="cvv"
                      type="text"
                      maxLength="3"
                      placeholder="123"
                      className={getInputClass('cvv')}
                      value={formik.values.cvv}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.cvv && formik.errors.cvv && (
                      <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {formik.errors.cvv}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  disabled={!formik.isValid || !formik.dirty}
                >
                  <i className="fas fa-lock"></i>
                  Pay ₹{plans.find(p => p.id === selectedPlan)?.totalPrice.toLocaleString()}
                </button>
              </form>

              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                <i className="fas fa-shield-alt text-green-600"></i>
                Your payment information is encrypted and secure
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
