import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const cardSchema = Yup.object({
  cardNumber: Yup.string()
    .matches(/^[0-9]{16}$/, 'Card number must be exactly 16 digits')
    .required('Card number is required'),
  expiryMonth: Yup.string()
    .matches(/^(0[1-9]|1[0-2])$/, 'Invalid month (01-12)')
    .required('Expiry month is required'),
  expiryYear: Yup.string()
    .matches(/^20[2-9][0-9]$/, 'Invalid year')
    .test('not-expired', 'Card has expired', function (value) {
      const month = this.parent.expiryMonth;
      if (!value || !month) return true;
      return new Date(parseInt(value), parseInt(month) - 1) >= new Date();
    })
    .required('Expiry year is required'),
  cvv: Yup.string()
    .matches(/^[0-9]{3}$/, 'CVV must be exactly 3 digits')
    .required('CVV is required'),
});

const getInputClass = (name, formik) => {
  const hasError = formik.touched[name] && formik.errors[name];
  const hasValue = formik.values[name];
  const isValid = formik.touched[name] && !formik.errors[name] && hasValue;
  return `w-full px-4 py-3.5 border-2 rounded-lg text-base transition-all font-mono ${
    hasError
      ? 'border-red-500 bg-red-50'
      : isValid
      ? 'border-green-500 bg-green-50'
      : 'border-gray-300'
  } focus:outline-none focus:border-indigo-600 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)]`;
};

const FeePaymentModal = ({ isOpen, onClose, onConfirm, fees, budget, isBoosted }) => {
  const formik = useFormik({
    initialValues: { cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' },
    validationSchema: cardSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      onConfirm({
        cardLast4: values.cardNumber.slice(-4),
        expiryMonth: values.expiryMonth,
        expiryYear: values.expiryYear,
      });
    },
  });

  if (!isOpen) return null;

  const feeAmount = fees.platformFeeAmount;
  const isFree = feeAmount === 0;

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-[1000] animate-[fadeIn_300ms_ease]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-10 max-w-lg w-[90%] max-h-[90vh] overflow-y-auto relative animate-[slideUp_400ms_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-5 right-5 bg-transparent border-none text-2xl text-gray-600 cursor-pointer transition-all w-10 h-10 flex items-center justify-center rounded-full hover:text-black hover:bg-gray-100"
          onClick={onClose}
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
                onClick={onClose}
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
          <form onSubmit={formik.handleSubmit} noValidate className="mt-2">
            {/* Card Number */}
            <div className="mb-5">
              <label htmlFor="cardNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                Card Number
              </label>
              <input
                id="cardNumber"
                name="cardNumber"
                type="text"
                maxLength={16}
                placeholder="1234567890123456"
                className={getInputClass('cardNumber', formik)}
                value={formik.values.cardNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.cardNumber && formik.errors.cardNumber && (
                <div className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5 font-medium">
                  <i className="fas fa-exclamation-circle" /> {formik.errors.cardNumber}
                </div>
              )}
              {formik.touched.cardNumber && !formik.errors.cardNumber && formik.values.cardNumber && (
                <div className="text-green-600 text-sm mt-1.5 flex items-center gap-1.5 font-medium">
                  <i className="fas fa-check-circle" /> Valid card number
                </div>
              )}
            </div>

            {/* Month / Year / CVV */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="mb-5">
                <label htmlFor="expiryMonth" className="block text-sm font-semibold text-gray-900 mb-2">
                  Expiry Month
                </label>
                <input
                  id="expiryMonth"
                  name="expiryMonth"
                  type="text"
                  maxLength={2}
                  placeholder="MM"
                  className={getInputClass('expiryMonth', formik)}
                  value={formik.values.expiryMonth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.expiryMonth && formik.errors.expiryMonth && (
                  <div className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5 font-medium">
                    <i className="fas fa-exclamation-circle" /> {formik.errors.expiryMonth}
                  </div>
                )}
              </div>

              <div className="mb-5">
                <label htmlFor="expiryYear" className="block text-sm font-semibold text-gray-900 mb-2">
                  Expiry Year
                </label>
                <input
                  id="expiryYear"
                  name="expiryYear"
                  type="text"
                  maxLength={4}
                  placeholder="YYYY"
                  className={getInputClass('expiryYear', formik)}
                  value={formik.values.expiryYear}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.expiryYear && formik.errors.expiryYear && (
                  <div className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5 font-medium">
                    <i className="fas fa-exclamation-circle" /> {formik.errors.expiryYear}
                  </div>
                )}
              </div>

              <div className="mb-5">
                <label htmlFor="cvv" className="block text-sm font-semibold text-gray-900 mb-2">
                  CVV
                </label>
                <input
                  id="cvv"
                  name="cvv"
                  type="text"
                  maxLength={3}
                  placeholder="123"
                  className={getInputClass('cvv', formik)}
                  value={formik.values.cvv}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.cvv && formik.errors.cvv && (
                  <div className="text-red-500 text-sm mt-1.5 flex items-center gap-1.5 font-medium">
                    <i className="fas fa-exclamation-circle" /> {formik.errors.cvv}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3.5 border-2 border-gray-300 rounded-xl text-gray-600 font-semibold text-base hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!formik.isValid || !formik.dirty}
                className="flex-[2] px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all flex items-center justify-center gap-3 hover:scale-105 hover:shadow-[0_8px_24px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <i className="fas fa-lock" />
                Pay ₹{feeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </button>
            </div>

            <div className="text-center text-gray-600 text-sm mt-4 flex items-center justify-center gap-2">
              <i className="fas fa-shield-alt" />
              Your payment information is encrypted and secure
            </div>
          </form>
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
