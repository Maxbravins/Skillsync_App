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

export const sendApplicationEmail = async ({
  email,
  clientName,
  developerName,
  jobTitle,
}) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "New Job Application - SkillSync",
      html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
        <h2 style="color:#06b6d4;">SkillSync</h2>

        <p>Hello <strong>${clientName}</strong>,</p>

        <p>
          A developer has submitted an application for your job posting.
        </p>

        <table style="width:100%;margin-top:20px;border-collapse:collapse;">
          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Developer</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">${developerName}</td>
          </tr>

          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Job</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">${jobTitle}</td>
          </tr>
        </table>

        <p style="margin-top:25px;">
          Log in to SkillSync to review this application.
        </p>

        <hr>

        <p style="font-size:12px;color:#888;">
          © 2026 SkillSync. All rights reserved.
        </p>

      </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const sendAcceptanceEmail = async ({
  email,
  developerName,
  jobTitle,
}) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Congratulations! Your Application Was Accepted",

      html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;border:1px solid #ddd;border-radius:10px;">

        <h2 style="color:#06b6d4;text-align:center;">
          SkillSync
        </h2>

        <h3 style="color:#16a34a;">
          Congratulations ${developerName}! 
        </h3>

        <p>
          We are pleased to inform you that your application has been
          <strong>accepted</strong>.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-top:20px;">
          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Job</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">${jobTitle}</td>
          </tr>
        </table>

        <p style="margin-top:25px;">
          Please log into your SkillSync account to view the next steps
          and communicate with the client.
        </p>

        <hr>

        <p style="font-size:12px;color:#888;text-align:center;">
          © 2026 SkillSync. All rights reserved.
        </p>

      </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};