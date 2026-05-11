import { loadStripe } from "@stripe/stripe-js";

let stripePromise: ReturnType<typeof loadStripe>;

export const getStripe = async () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");
  }
  return stripePromise;
};

export const validateCardDetails = (cardDetails: {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  cardholderName: string;
}) => {
  const errors: Record<string, string> = {};

  // Validate card number (basic Luhn check)
  const cardNum = cardDetails.cardNumber.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(cardNum)) {
    errors.cardNumber = "Invalid card number";
  }

  // Validate expiry date
  if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
    errors.expiryDate = "Invalid expiry date (MM/YY)";
  } else {
    const [month, year] = cardDetails.expiryDate.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expYear = parseInt(year);
    const expMonth = parseInt(month);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      errors.expiryDate = "Card has expired";
    }
  }

  // Validate CVV
  if (!/^\d{3,4}$/.test(cardDetails.cvc)) {
    errors.cvc = "Invalid CVV";
  }

  // Validate cardholder name
  if (cardDetails.cardholderName.trim().length < 3) {
    errors.cardholderName = "Invalid cardholder name";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const maskCardNumber = (cardNumber: string) => {
  const cleaned = cardNumber.replace(/\s/g, "");
  return `****-****-****-${cleaned.slice(-4)}`;
};
