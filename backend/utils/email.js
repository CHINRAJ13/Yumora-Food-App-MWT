import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Sends an Email using NodeMailer (Gmail)
 */
export const sendEmail = async (to, subject, text) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS missing in .env. Skipping email.");
    return { success: false, error: "Missing email credentials" };
  }

  if (!to) {
    console.warn("⚠️ Recipient email is missing. Skipping email.");
    return { success: false, error: "Missing recipient" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Yumora" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: `<p>${text}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} via Gmail: ${info.response}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Gmail Email Error:", error.message);
    return { success: false, error: error.message };
  }
};
