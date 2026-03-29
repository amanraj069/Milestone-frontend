/**
 * Dynamically loads the Razorpay checkout script.
 * Returns a promise that resolves to true when loaded, or rejects on failure.
 */
export default function loadRazorpay() {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (window.Razorpay) {
      return resolve(true);
    }

    // If a script tag already exists (e.g. from a previous attempt), wait for it
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => {
        existing.remove();
        reject(new Error("Failed to load Razorpay SDK"));
      });
      // Already finished loading but Razorpay not on window yet — tiny race guard
      if (window.Razorpay) return resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.crossOrigin = "anonymous";

    const timeout = setTimeout(() => {
      reject(
        new Error(
          "Razorpay SDK load timed out. Check your internet connection.",
        ),
      );
    }, 10000);

    script.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      reject(
        new Error(
          "Failed to load Razorpay SDK. Please disable ad-blockers and try again.",
        ),
      );
    };

    document.body.appendChild(script);
  });
}
