import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const sendSMS = async (phone, message) => {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: message,
        language: "english",
        numbers: phone,
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
    return { success: false, error: err.message };
  }
};
