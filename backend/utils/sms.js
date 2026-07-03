import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const sendSMS = async (phone, message) => {
  try {
    // Fast2SMS expects a 10 digit number
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10); // get last 10 digits
    }

    if (!process.env.FAST2SMS_API_KEY) {
      console.warn("⚠️ Fast2SMS credentials missing in .env. Skipping SMS.");
      return { success: false, error: "Missing Fast2SMS Credentials" };
    }

    const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        route: "q",
        message: message,
        language: "english",
        flash: 0,
        numbers: cleanPhone,
      },
    });

    console.log("📲 SMS sent via Fast2SMS:", message);
    return { success: true, data: response.data };
  } catch (err) {
    console.log("❌ Fast2SMS error:", err.message);
    if (err.response) {
      console.log("❌ Fast2SMS error details:", JSON.stringify(err.response.data));
    }
    return { success: false, error: err.message };
  }
};
