import React, { useState } from "react";
import loadRazorpay from "../utils/loadRazorpay";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

/**
 * PaymentButton — triggers a Razorpay checkout flow.
 *
 * Props:
 *  - amount      : price in rupees (will be converted to paise)
 *  - description : item / plan description shown in checkout
 *  - onSuccess   : callback(paymentId) after verified payment
 *  - onFailure   : callback(error) on failure
 *
 * Test credentials (Razorpay Test Mode):
 *  - Card : 5104 0155 5555 5558, any CVV, any future expiry
 *  - UPI  : success@razorpay
 */
export default function PaymentButton({
  amount,
  description = "Payment",
  onSuccess,
  onFailure,
}) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. Load Razorpay SDK
      await loadRazorpay();

      // 2. Create order on backend (amount in paise)
      const orderRes = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: amount * 100, currency: "INR", paymentType: "subscription" }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to create order");
      }

      // 3. Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Milestone",
        description,
        order_id: orderData.orderId,
        handler: async (response) => {
          // 4. Verify payment on backend
          try {
            const verifyRes = await fetch(
              `${BACKEND_URL}/api/payment/verify`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              onSuccess?.(verifyData.paymentId);
            } else {
              onFailure?.(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            onFailure?.(err.message || "Verification request failed");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        onFailure?.(
          response.error?.description || "Payment failed. Please try again."
        );
        setLoading(false);
      });

      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      onFailure?.(error.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Processing…
        </>
      ) : (
        `Pay ₹${amount}`
      )}
    </button>
  );
}
