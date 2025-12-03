import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const PlanSelectionModal = ({ isOpen, onClose, onSelectPlan, userType }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const plans = userType === 'Employer' ? [
    { id: '3months', duration: '3 Months', monthlyPrice: 868, totalPrice: 2604, discount: 0, savings: 0 },
    { id: '9months', duration: '9 Months', monthlyPrice: 780, totalPrice: 7020, discount: 10, savings: 792, popular: true },
    { id: '1year', duration: '12 Months', monthlyPrice: 650, totalPrice: 7800, discount: 25, savings: 2616, bestValue: true },
  ] : [
    { id: '3months', duration: '3 Months', monthlyPrice: 869, totalPrice: 2607, discount: 0, savings: 0 },
    { id: '9months', duration: '9 Months', monthlyPrice: 782, totalPrice: 7038, discount: 10, savings: 783, popular: true },
    { id: '1year', duration: '12 Months', monthlyPrice: 651, totalPrice: 7812, discount: 25, savings: 2616, bestValue: true },
  ];

  const validationSchema = Yup.object({
    cardNumber: Yup.string().matches(/^[0-9]{16}$/, 'Card number must be exactly 16 digits').required('Card number is required'),
    expiryMonth: Yup.string().matches(/^(0[1-9]|1[0-2])$/, 'Invalid month (01-12)').required('Expiry month is required'),
    expiryYear: Yup.string().matches(/^20[2-9][0-9]$/, 'Invalid year').test('not-expired', 'Card has expired', function(value) {
      if (!value) return false;
      const month = this.parent.expiryMonth;
      if (!month) return true;
      const currentDate = new Date();
      const expiryDate = new Date(parseInt(value), parseInt(month) - 1);
      return expiryDate >= currentDate;
    }).required('Expiry year is required'),
    cvv: Yup.string().matches(/^[0-9]{3}$/, 'CVV must be exactly 3 digits').required('CVV is required'),
  });

  const formik = useFormik({
    initialValues: { cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' },
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
        paymentDetails: { cardNumber: values.cardNumber.slice(-4), expiryMonth: values.expiryMonth, expiryYear: values.expiryYear },
      });
    },
  });

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
    return `w-full px-4 py-3.5 border-2 rounded-lg text-base transition-all font-mono ${
      hasError ? 'border-red-500 bg-red-50' : isValid ? 'border-green-500 bg-green-50' : 'border-gray-300'
    } focus:outline-none focus:border-indigo-600 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)]`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[1000] animate-[fadeIn_300ms_ease]" onClick={onClose}>
      <div className="bg-white rounded-3xl p-10 max-w-4xl w-[90%] max-h-[90vh] overflow-y-auto relative animate-[slideUp_400ms_ease]" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-5 right-5 bg-transparent border-none text-2xl text-gray-600 cursor-pointer transition-all w-10 h-10 flex items-center justify-center rounded-full hover:text-black hover:bg-gray-100" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        {!showPaymentForm ? (
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
            <button className="bg-transparent border-none text-indigo-600 text-sm font-semibold cursor-pointer flex items-center gap-2 mb-6 px-2 py-2 rounded-lg transition-all hover:bg-gray-100" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i> Back to Plans
            </button>

            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Payment Details</h2>
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-5 py-4 rounded-xl mb-6 text-base font-semibold text-indigo-900 flex items-center gap-3">
              <i className="fas fa-check-circle"></i>
              {plans.find(p => p.id === selectedPlan)?.duration} Plan - ₹{plans.find(p => p.id === selectedPlan)?.totalPrice.toLocaleString()}
            </div>

            <form onSubmit={formik.handleSubmit} className="mt-6">
              <div className="mb-5">
                <label htmlFor="cardNumber" className="block text-sm font-semibold text-gray-900 mb-2">Card Number</label>
                <input id="cardNumber" name="cardNumber" type="text" maxLength="16" placeholder="1234567890123456" className={getInputClass('cardNumber')} value={formik.values.cardNumber} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                {formik.touched.cardNumber && formik.errors.cardNumber && (
                  <div className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5 font-medium"><i className="fas fa-exclamation-circle"></i>{formik.errors.cardNumber}</div>
                )}
                {formik.touched.cardNumber && !formik.errors.cardNumber && formik.values.cardNumber && (
                  <div className="text-green-600 text-sm mt-1.5 flex items-center gap-1.5 font-medium"><i className="fas fa-check-circle"></i>Valid card number</div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="mb-5">
                  <label htmlFor="expiryMonth" className="block text-sm font-semibold text-gray-900 mb-2">Expiry Month</label>
                  <input id="expiryMonth" name="expiryMonth" type="text" maxLength="2" placeholder="MM" className={getInputClass('expiryMonth')} value={formik.values.expiryMonth} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                  {formik.touched.expiryMonth && formik.errors.expiryMonth && (
                    <div className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5 font-medium"><i className="fas fa-exclamation-circle"></i>{formik.errors.expiryMonth}</div>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="expiryYear" className="block text-sm font-semibold text-gray-900 mb-2">Expiry Year</label>
                  <input id="expiryYear" name="expiryYear" type="text" maxLength="4" placeholder="YYYY" className={getInputClass('expiryYear')} value={formik.values.expiryYear} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                  {formik.touched.expiryYear && formik.errors.expiryYear && (
                    <div className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5 font-medium"><i className="fas fa-exclamation-circle"></i>{formik.errors.expiryYear}</div>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="cvv" className="block text-sm font-semibold text-gray-900 mb-2">CVV</label>
                  <input id="cvv" name="cvv" type="text" maxLength="3" placeholder="123" className={getInputClass('cvv')} value={formik.values.cvv} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                  {formik.touched.cvv && formik.errors.cvv && (
                    <div className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5 font-medium"><i className="fas fa-exclamation-circle"></i>{formik.errors.cvv}</div>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all mt-6 flex items-center justify-center gap-3 hover:scale-105 hover:shadow-[0_8px_24px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" disabled={!formik.isValid || !formik.dirty}>
                <i className="fas fa-lock"></i>
                Pay ₹{plans.find(p => p.id === selectedPlan)?.totalPrice.toLocaleString()}
              </button>
            </form>

            <div className="text-center text-gray-600 text-sm mt-4 flex items-center justify-center gap-2">
              <i className="fas fa-shield-alt"></i>
              Your payment information is encrypted and secure
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
