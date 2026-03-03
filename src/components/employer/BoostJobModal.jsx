import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

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
   Validation schema
───────────────────────────────────────────────── */
const cardSchema = Yup.object({
  cardNumber: Yup.string()
    .matches(/^[0-9]{16}$/, 'Must be exactly 16 digits')
    .required('Card number is required'),
  expiryMonth: Yup.string()
    .matches(/^(0[1-9]|1[0-2])$/, 'Invalid month (01–12)')
    .required('Required'),
  expiryYear: Yup.string()
    .matches(/^20[2-9][0-9]$/, 'Invalid year')
    .test('not-expired', 'Card has expired', function (value) {
      const month = this.parent.expiryMonth;
      if (!value || !month) return true;
      return new Date(parseInt(value), parseInt(month) - 1) >= new Date();
    })
    .required('Required'),
  cvv: Yup.string()
    .matches(/^[0-9]{3}$/, 'Must be 3 digits')
    .required('Required'),
});

/* ─────────────────────────────────────────────────
   Input class helper
───────────────────────────────────────────────── */
const inputCls = (name, formik) => {
  const err = formik.touched[name] && formik.errors[name];
  const ok = formik.touched[name] && !formik.errors[name] && formik.values[name];
  return [
    'w-full px-3.5 py-3 rounded-xl border text-sm font-mono transition-all outline-none',
    'focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400',
    err
      ? 'border-red-400 bg-red-50 text-red-900'
      : ok
      ? 'border-green-400 bg-green-50'
      : 'border-gray-200 bg-white hover:border-gray-300',
  ].join(' ');
};

/* ─────────────────────────────────────────────────
   Payment sub-form (defined outside BoostJobModal
   so hooks are called at a stable component level)
───────────────────────────────────────────────── */
const PaymentForm = ({ job, fees, onBack, onProcessing, onError, apiBaseUrl }) => {
  const formik = useFormik({
    initialValues: { cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' },
    validationSchema: cardSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      onProcessing();
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/employer/job-listings/${job.jobId}/boost`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              paymentDetails: {
                cardLast4: values.cardNumber.slice(-4),
                expiryMonth: values.expiryMonth,
                expiryYear: values.expiryYear,
              },
            }),
          }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          onError('');          // clear any error
          onError(null, data);  // signal success (second arg = response)
        } else {
          onError(data.error || 'Boost failed. Please try again.');
        }
      } catch {
        onError('Network error. Please try again.');
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-5">
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

      {/* Card number */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
          Card Number
        </label>
        <input
          name="cardNumber"
          maxLength={16}
          placeholder="•••• •••• •••• ••••"
          value={formik.values.cardNumber}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={inputCls('cardNumber', formik)}
        />
        {formik.touched.cardNumber && formik.errors.cardNumber && (
          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
            <i className="fas fa-exclamation-circle" />
            {formik.errors.cardNumber}
          </p>
        )}
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { name: 'expiryMonth', label: 'Month', placeholder: 'MM', maxLen: 2 },
          { name: 'expiryYear', label: 'Year', placeholder: 'YYYY', maxLen: 4 },
          { name: 'cvv', label: 'CVV', placeholder: '•••', maxLen: 3, type: 'password' },
        ].map(({ name, label, placeholder, maxLen, type }) => (
          <div key={name}>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              {label}
            </label>
            <input
              name={name}
              maxLength={maxLen}
              placeholder={placeholder}
              type={type || 'text'}
              value={formik.values[name]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={inputCls(name, formik)}
            />
            {formik.touched[name] && formik.errors[name] && (
              <p className="text-red-500 text-[10px] mt-1 leading-tight">{formik.errors[name]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-[0.98]"
        >
          <i className="fas fa-lock mr-1.5 text-xs opacity-75" />
          Pay & Activate Boost
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
        <i className="fas fa-shield-alt text-gray-300" />
        256-bit SSL encryption — your data is safe
      </p>
    </form>
  );
};

/* ─────────────────────────────────────────────────
   Main modal
───────────────────────────────────────────────── */
const BoostJobModal = ({ job, isOpen, onClose, onSuccess, apiBaseUrl }) => {
  const [step, setStep] = useState('info'); // 'info' | 'payment' | 'processing' | 'done'
  const [serverError, setServerError] = useState('');

  if (!isOpen || !job) return null;

  const fees = computeFees(job.budget, true, job.applicationCap);

  /* Called from PaymentForm — handles both error and success */
  const handlePaymentResult = (errMsg, successData) => {
    if (errMsg === null && successData) {
      // payment succeeded
      setStep('done');
      setTimeout(() => onSuccess(successData.data ?? successData), 1800);
    } else if (errMsg) {
      setStep('payment');
      setServerError(errMsg);
    } else {
      // clearing error
      setServerError('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,10,20,0.72)', backdropFilter: 'blur(5px)' }}
      onClick={step !== 'processing' && step !== 'done' ? onClose : undefined}
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
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all text-sm flex-shrink-0"
                >
                  <i className="fas fa-arrow-left" />
                </button>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Payment Details</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Secure · Encrypted · Instant activation</p>
                </div>
              </div>

              {serverError && (
                <div className="flex items-center gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <i className="fas fa-exclamation-circle text-red-400 flex-shrink-0" />
                  {serverError}
                </div>
              )}

              <PaymentForm
                job={job}
                fees={fees}
                onBack={() => setStep('info')}
                onProcessing={() => setStep('processing')}
                onError={handlePaymentResult}
                apiBaseUrl={apiBaseUrl}
              />
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
                  Processing payment and updating your listing…
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
