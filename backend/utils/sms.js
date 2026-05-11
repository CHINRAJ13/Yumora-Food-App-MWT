import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const sendSMS = async (phone, message) => {
    // Strip non-numeric characters (ensure it's just 10 digits for Indian numbers)
    try {
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: message,
        language: "english",
        numbers: formattedPhone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📲 SMS sent:", message);
    return { success: true };
  } catch (err) {
    console.log("❌ SMS error:", err.message);
    if (err.response) {
      console.log("❌ SMS error details:", JSON.stringify(err.response.data));
    }
    return { success: false, error: err.message };
  }
};
