import React, { useState } from "react";
import { Link } from "react-router-dom";
import PaymentButton from "../components/PaymentButton";

/**
 * Razorpay Test Credentials (Test Mode):
 *  - Card : 5104 0155 5555 5558, any CVV, any future expiry
 *  - UPI  : success@razorpay
 */

const PLANS = [
  {
    id: 1,
    name: "Basic Plan",
    price: 99,
    features: ["5 Job Postings", "Basic Analytics", "Email Support"],
    color: "bg-white",
    badge: null,
  },
  {
    id: 2,
    name: "Pro Plan",
    price: 299,
    features: [
      "25 Job Postings",
      "Advanced Analytics",
      "Priority Support",
      "Featured Listings",
    ],
    color: "bg-indigo-50",
    badge: "Popular",
  },
  {
    id: 3,
    name: "Premium Plan",
    price: 999,
    features: [
      "Unlimited Postings",
      "Real-time Analytics",
      "24/7 Dedicated Support",
      "Featured Listings",
      "Custom Branding",
    ],
    color: "bg-white",
    badge: null,
  },
];

export default function PaymentDemo() {
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  const handleSuccess = (paymentId) => {
    setErrorInfo(null);
    setSuccessInfo(paymentId);
  };

  const handleFailure = (error) => {
    setSuccessInfo(null);
    setErrorInfo(typeof error === "string" ? error : "Payment failed");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            Milestone
          </Link>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Razorpay Test Mode
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Title */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Choose Your Plan
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Demo payment integration powered by Razorpay Test Mode
          </p>
        </div>

        {/* Status banners */}
        {successInfo && (
          <div className="mx-auto mb-8 flex max-w-xl items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-4">
            <svg
              className="h-6 w-6 shrink-0 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-green-800">
                Payment Successful!
              </p>
              <p className="text-sm text-green-700">
                Payment ID:{" "}
                <span className="font-mono font-medium">{successInfo}</span>
              </p>
            </div>
            <button
              onClick={() => setSuccessInfo(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        )}

        {errorInfo && (
          <div className="mx-auto mb-8 flex max-w-xl items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-4">
            <svg
              className="h-6 w-6 shrink-0 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-red-800">Payment Failed</p>
              <p className="text-sm text-red-700">{errorInfo}</p>
            </div>
            <button
              onClick={() => setErrorInfo(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border border-slate-200 ${plan.color} p-8 shadow-sm transition-shadow hover:shadow-md`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}

              <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>

              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  ₹{plan.price}
                </span>
                <span className="text-sm text-slate-500">/ month</span>
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <svg
                      className="h-4 w-4 shrink-0 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <PaymentButton
                  amount={plan.price}
                  description={plan.name}
                  onSuccess={handleSuccess}
                  onFailure={handleFailure}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Test credentials info */}
        <div className="mx-auto mt-12 max-w-xl rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <h3 className="mb-3 font-semibold text-slate-800">
            Test Credentials (Razorpay Test Mode)
          </h3>
          <ul className="space-y-1">
            <li>
              <span className="font-medium">Card:</span>{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                5104 0155 5555 5558
              </code>
              , any CVV, any future expiry
            </li>
            <li>
              <span className="font-medium">UPI:</span>{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                success@razorpay
              </code>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
