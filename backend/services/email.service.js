import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "SkillSync - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #0ea5e9; text-align: center;">SkillSync</h2>
          <h3 style="text-align: center;">Password Reset Request</h3>
          <p>You requested to reset your password. Use the OTP below:</p>
          <div style="text-align: center; padding: 16px; font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f0f4f8; border-radius: 8px; margin: 16px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          <hr style="border: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 SkillSync. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

export const sendResetSuccessEmail = async (email) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "SkillSync - Password Reset Successful",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0ea5e9; text-align: center;">SkillSync</h2>
        <h3 style="text-align: center;">Password Reset Successful</h3>
        <p>Your password has been reset successfully.</p>
        <p>If you didn't perform this action, please contact support immediately.</p>
        <hr style="border: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">© 2026 SkillSync. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};