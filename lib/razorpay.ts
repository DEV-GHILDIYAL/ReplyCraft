import Razorpay from "razorpay";

// Initialize Razorpay SDK
export const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId === "your-key-id" || keySecret === "your-razorpay-secret") {
    // Return null or throw error to indicate we are running in simulated mock mode
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

export const PLANS_PRICES = {
  free: 0,
  pro: 999, // in INR
  business: 2499, // in INR
};
