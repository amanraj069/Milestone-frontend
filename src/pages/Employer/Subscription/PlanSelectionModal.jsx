import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import './PlanSelectionModal.css';

const PlanSelectionModal = ({ isOpen, onClose, onSelectPlan, userType }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

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
      duration: '12 Months',
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
      duration: '12 Months',
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
      // Extract numeric duration from string (e.g., "3 Months" -> 3)
      const numericDuration = parseInt(plan.duration);
      
      onSelectPlan({
        plan: selectedPlan,
        duration: numericDuration,
        durationText: plan.duration,
        totalPrice: plan.totalPrice,
        paymentDetails: {
          cardNumber: values.cardNumber.slice(-4), // Only store last 4 digits
          expiryMonth: values.expiryMonth,
          expiryYear: values.expiryYear,
        },
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
    
    return `payment-input ${hasError ? 'error' : ''} ${isValid ? 'valid' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-subscription" onClick={onClose}>
      <div className="modal-content-subscription" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-subscription" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        {!showPaymentForm ? (
          <>
            <h2 className="modal-title-subscription">Choose Your Plan Duration</h2>
            <p className="modal-subtitle-subscription">Select the plan that works best for you</p>

            <div className="plans-container-subscription">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`plan-option-subscription ${plan.bestValue ? 'best-value' : ''} ${plan.popular ? 'popular' : ''}`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.bestValue && <div className="badge-subscription best">BEST VALUE</div>}
                  {plan.popular && !plan.bestValue && <div className="badge-subscription popular">POPULAR</div>}
                  
                  <div className="plan-duration-subscription">{plan.duration}</div>
                  
                  <div className="plan-pricing-subscription">
                    <div className="monthly-price-subscription">
                      ₹{plan.monthlyPrice}
                      <span className="per-month-subscription">/month</span>
                    </div>
                    <div className="total-price-subscription">
                      Total: ₹{plan.totalPrice.toLocaleString()}
                    </div>
                  </div>

                  {plan.discount > 0 && (
                    <div className="savings-subscription">
                      <i className="fas fa-tag"></i>
                      Save {plan.discount}% (₹{plan.savings})
                    </div>
                  )}

                  <button className="select-plan-btn-subscription">
                    Select Plan
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <button className="back-button-subscription" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i> Back to Plans
            </button>

            <h2 className="modal-title-subscription">Payment Details</h2>
            <div className="selected-plan-info-subscription">
              <i className="fas fa-check-circle"></i>
              {plans.find(p => p.id === selectedPlan)?.duration} Plan - 
              ₹{plans.find(p => p.id === selectedPlan)?.totalPrice.toLocaleString()}
            </div>

            <form onSubmit={formik.handleSubmit} className="payment-form-subscription">
              <div className="form-group-subscription">
                <label htmlFor="cardNumber">Card Number</label>
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
                  <div className="error-message-subscription">
                    <i className="fas fa-exclamation-circle"></i>
                    {formik.errors.cardNumber}
                  </div>
                )}
                {formik.touched.cardNumber && !formik.errors.cardNumber && formik.values.cardNumber && (
                  <div className="success-message-subscription">
                    <i className="fas fa-check-circle"></i>
                    Valid card number
                  </div>
                )}
              </div>

              <div className="form-row-subscription">
                <div className="form-group-subscription">
                  <label htmlFor="expiryMonth">Expiry Month</label>
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
                    <div className="error-message-subscription">
                      <i className="fas fa-exclamation-circle"></i>
                      {formik.errors.expiryMonth}
                    </div>
                  )}
                </div>

                <div className="form-group-subscription">
                  <label htmlFor="expiryYear">Expiry Year</label>
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
                    <div className="error-message-subscription">
                      <i className="fas fa-exclamation-circle"></i>
                      {formik.errors.expiryYear}
                    </div>
                  )}
                </div>

                <div className="form-group-subscription">
                  <label htmlFor="cvv">CVV</label>
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
                    <div className="error-message-subscription">
                      <i className="fas fa-exclamation-circle"></i>
                      {formik.errors.cvv}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="submit-payment-btn-subscription"
                disabled={!formik.isValid || !formik.dirty}
              >
                <i className="fas fa-lock"></i>
                Pay ₹{plans.find(p => p.id === selectedPlan)?.totalPrice.toLocaleString()}
              </button>
            </form>

            <div className="security-note-subscription">
              <i className="fas fa-shield-alt"></i>
              Your payment information is encrypted and secure
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlanSelectionModal;
