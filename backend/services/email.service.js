import dotenv from "dotenv";
dotenv.config();

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "SkillSync <onboarding@resend.dev>";

export const sendEmail = async ({ to, subject, html }) => {
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn("Email delivery skipped: RESEND_API_KEY is not configured.");
    return { success: false, skipped: true, reason: "missing_api_key" };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    return { success: true, skipped: false };
  } catch (error) {
    console.error("Email delivery failed:", error);
    return { success: false, skipped: false, reason: error.message };
  }
};

export const sendOTP = async (email, otp) => {
  return sendEmail({
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
  });
};

export const sendResetSuccessEmail = async (email) => {
  return sendEmail({
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
  });
};

export const sendApplicationEmail = async ({
  email,
  clientName,
  developerName,
  jobTitle,
}) => {
  return sendEmail({
    to: email,
    subject: "New Job Application - SkillSync",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
        <h2 style="color:#06b6d4;">SkillSync</h2>
        <p>Hello <strong>${clientName}</strong>,</p>
        <p>A developer has submitted an application for your job posting.</p>
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
        <p style="margin-top:25px;">Log in to SkillSync to review this application.</p>
        <hr>
        <p style="font-size:12px;color:#888;">© 2026 SkillSync. All rights reserved.</p>
      </div>
    `,
  });
};

export const sendAcceptanceEmail = async ({
  email,
  developerName,
  jobTitle,
}) => {
  return sendEmail({
    to: email,
    subject: "Congratulations! Your Application Was Accepted",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;border:1px solid #ddd;border-radius:10px;">
        <h2 style="color:#06b6d4;text-align:center;">SkillSync</h2>
        <h3 style="color:#16a34a;">Congratulations ${developerName}!</h3>
        <p>We are pleased to inform you that your application has been <strong>accepted</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:20px;">
          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Job</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">${jobTitle}</td>
          </tr>
        </table>
        <p style="margin-top:25px;">Please log into your SkillSync account to view the next steps and communicate with the client.</p>
        <hr>
        <p style="font-size:12px;color:#888;text-align:center;">© 2026 SkillSync. All rights reserved.</p>
      </div>
    `,
  });
};

export const sendNewJobAlertEmail = async ({
  email,
  developerName,
  jobTitle,
  category,
  budget,
  clientName,
}) => {
  return sendEmail({
    to: email,
    subject: ` New ${category} Job Available on SkillSync`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:25px;border:1px solid #ddd;border-radius:10px;">
        <h2 style="color:#06b6d4;text-align:center;">SkillSync</h2>

        <h3>Hello ${developerName},</h3>

        <p>A new project matching your skills has just been posted.</p>

        <table style="width:100%;border-collapse:collapse;margin-top:20px;">
          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Job</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">${jobTitle}</td>
          </tr>

          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Category</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">${category}</td>
          </tr>

          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Budget</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">KES ${budget}</td>
          </tr>

          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Client</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">${clientName}</td>
          </tr>
        </table>

        <p style="margin-top:25px;">
          Login to SkillSync and apply before the opportunity closes.
        </p>

        <hr>

        <p style="font-size:12px;color:#888;text-align:center;">
          SkillSync automatically matches jobs with developers based on their skills.
        </p>

      </div>
    `,
  });
};

  // Payment Confirmation Email (Client)
export const sendPaymentConfirmationToClient = async ({
  email,
  clientName,
  jobTitle,
  amount,
}) => {
  return sendEmail({
    to: email,
    subject: "Payment Successful - SkillSync",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;border:1px solid #ddd;border-radius:10px;">
        <h2 style="color:#06b6d4;">SkillSync</h2>

        <h3>Hello ${clientName},</h3>

        <p>Your payment has been received successfully.</p>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Project</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">${jobTitle}</td>
          </tr>

          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Amount Paid</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">KES ${amount}</td>
          </tr>
        </table>

        <p style="margin-top:20px;">
        Your project has officially started.
        </p>

        <hr>

        <p style="font-size:12px;color:#888;">
        © SkillSync
        </p>

      </div>
    `,
  });
};

    // Payment Confirmation Email (Developer)
export const sendPaymentReceivedEmail = async ({
  email,
  developerName,
  jobTitle,
  amount,
}) => {
  return sendEmail({
    to: email,
    subject: "You've Been Paid - SkillSync",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;border:1px solid #ddd;border-radius:10px;">

        <h2 style="color:#06b6d4;">SkillSync</h2>

        <h3>Hello ${developerName},</h3>

        <p>Good news!</p>

        <p>
        The client has successfully paid for your project.
        </p>

        <table style="width:100%;border-collapse:collapse;">

          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Project</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">${jobTitle}</td>
          </tr>

          <tr>
            <td style="padding:10px;border:1px solid #ddd;"><strong>Total Paid</strong></td>
            <td style="padding:10px;border:1px solid #ddd;">KES ${amount}</td>
          </tr>

        </table>

        <p style="margin-top:20px;">
        Your earnings have been placed in your SkillSync Wallet.
        They will become available after admin approval.
        </p>

        <hr>

        <p style="font-size:12px;color:#888;">
        © SkillSync
        </p>

      </div>
    `,
  });
};
    // Admin Payment Release Email (Developer)
export const sendPaymentReleasedEmail = async ({
  email,
  developerName,
  amount,
}) => {
  return sendEmail({
    to: email,
    subject: "Payment Released - SkillSync",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;border:1px solid #ddd;border-radius:10px;">

        <h2 style="color:#06b6d4;">SkillSync</h2>

        <h3>Hello ${developerName},</h3>

        <p>Great news!</p>

        <p>Your payment has been approved by the SkillSync administrator.</p>

        <h2 style="color:#16a34a;">
          KES ${amount}
        </h2>

        <p>
        The money is now available in your wallet and can be withdrawn.
        </p>

        <hr>

        <p style="font-size:12px;color:#888;">
        © SkillSync
        </p>

      </div>
    `,
  });
};
    // Admin Withdrawal Approval Email (Developer)
export const sendWithdrawalApprovedEmail = async ({
  email,
  developerName,
  amount,
}) => {
  return sendEmail({
    to: email,
    subject: "Withdrawal Approved - SkillSync",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;border:1px solid #ddd;border-radius:10px;">

        <h2 style="color:#06b6d4;">SkillSync</h2>

        <h3>Hello ${developerName},</h3>

        <p>Your withdrawal request has been approved.</p>

        <h2 style="color:#16a34a;">
          KES ${amount}
        </h2>

        <p>
        Your payment will be sent to your M-Pesa account shortly.
        </p>

        <hr>

        <p style="font-size:12px;color:#888;">
        © SkillSync
        </p>

      </div>
    `,
  });
};
    // Admin Withdrawal Rejection Email (Developer)
export const sendWithdrawalRejectedEmail = async ({
  email,
  developerName,
  amount,
}) => {
  return sendEmail({
    to: email,
    subject: "Withdrawal Rejected - SkillSync",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;border:1px solid #ddd;border-radius:10px;">

        <h2 style="color:#06b6d4;">SkillSync</h2>

        <h3>Hello ${developerName},</h3>

        <p>
        Unfortunately your withdrawal request was rejected.
        </p>

        <p>
        Amount:
        <strong>KES ${amount}</strong>
        </p>

        <p>
        The money has been returned to your SkillSync Wallet.
        </p>

        <hr>

        <p style="font-size:12px;color:#888;">
        © SkillSync
        </p>

      </div>
    `,
  });
};

    // Application Rejection Email
  export const sendRejectionEmail = async ({
    email,
    developerName,
    jobTitle,
  }) => {
  return sendEmail({
    to: email,
    subject: `Application Update - ${jobTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;border:1px solid #ddd;border-radius:10px;">
        <h2 style="color:#06b6d4;">SkillSync</h2>
        <h3>Hello ${developerName},</h3>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> project on SkillSync.</p>
        <p>Unfortunately, your application was not selected for this project.</p>
        <p>Don't be discouraged — keep applying for other opportunities on SkillSync.</p>
        <p>Best regards,<br><strong>SkillSync Team</strong></p>
        <hr>
        <p style="font-size:12px;color:#888;text-align:center;">© 2026 SkillSync. All rights reserved.</p>
      </div>
    `,
  });
};