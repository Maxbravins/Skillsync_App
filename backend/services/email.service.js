import dotenv from "dotenv";
dotenv.config();

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "SkillSync <onboarding@resend.dev>";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

// Escape values before inserting user-controlled data into HTML.
const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Common SkillSync email layout
const emailLayout = ({
  title,
  content,
  footerText = "© 2026 SkillSync. All rights reserved.",
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>${escapeHtml(title)}</title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f5f7fa;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        "
      >

        <div
          style="
            width:100%;
            padding:40px 15px;
            box-sizing:border-box;
          "
        >

          <div
            style="
              max-width:600px;
              margin:0 auto;
              background:#ffffff;
              border:1px solid #e5e7eb;
              border-radius:12px;
              overflow:hidden;
              box-shadow:0 2px 8px rgba(0,0,0,0.05);
            "
          >

            <!-- Header -->
            <div
              style="
                background:#06b6d4;
                padding:24px;
                text-align:center;
              "
            >
              <h1
                style="
                  margin:0;
                  color:#ffffff;
                  font-size:26px;
                  font-weight:700;
                "
              >
                SkillSync
              </h1>
            </div>

            <!-- Content -->
            <div
              style="
                padding:30px 25px;
              "
            >
              <h2
                style="
                  margin-top:0;
                  color:#111827;
                  font-size:22px;
                "
              >
                ${escapeHtml(title)}
              </h2>

              ${content}
            </div>

            <!-- Footer -->
            <div
              style="
                border-top:1px solid #e5e7eb;
                padding:20px;
                text-align:center;
                background:#fafafa;
              "
            >
              <p
                style="
                  margin:0;
                  color:#9ca3af;
                  font-size:12px;
                "
              >
                ${escapeHtml(footerText)}
              </p>
            </div>

          </div>

        </div>

      </body>
    </html>
  `;
};

/*
|--------------------------------------------------------------------------
| Core Email Sender
|--------------------------------------------------------------------------
*/

export const sendEmail = async ({
  to,
  subject,
  html,
}) => {
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn(
      "Email delivery skipped: RESEND_API_KEY is not configured."
    );

    return {
      success: false,
      skipped: true,
      reason: "missing_api_key",
    };
  }

  if (!to) {
    console.error("Email delivery failed: recipient email is missing.");

    return {
      success: false,
      skipped: false,
      reason: "missing_recipient",
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error(
        "Resend email delivery failed:",
        error
      );

      return {
        success: false,
        skipped: false,
        reason: error.message || "resend_error",
        error,
      };
    }

    return {
      success: true,
      skipped: false,
      id: data?.id || null,
    };
  } catch (error) {
    console.error(
      "Email delivery failed:",
      error
    );

    return {
      success: false,
      skipped: false,
      reason:
        error.message ||
        "email_delivery_failed",
    };
  }
};

/*
|--------------------------------------------------------------------------
| Password Reset OTP
|--------------------------------------------------------------------------
*/

export const sendOTP = async (
  email,
  otp
) => {
  const safeOtp = escapeHtml(otp);

  const html = emailLayout({
    title: "Password Reset Request",

    content: `
      <p style="font-size:15px;line-height:1.6;">
        You requested to reset your SkillSync password.
        Use the verification code below to continue.
      </p>

      <div
        style="
          margin:25px 0;
          padding:20px;
          background:#f0f9ff;
          border:1px solid #bae6fd;
          border-radius:10px;
          text-align:center;
        "
      >
        <div
          style="
            color:#64748b;
            font-size:13px;
            margin-bottom:8px;
          "
        >
          Your verification code
        </div>

        <div
          style="
            color:#0284c7;
            font-size:34px;
            font-weight:700;
            letter-spacing:8px;
          "
        >
          ${safeOtp}
        </div>
      </div>

      <p
        style="
          color:#6b7280;
          font-size:14px;
          line-height:1.6;
        "
      >
        This OTP will expire in <strong>10 minutes</strong>.
      </p>

      <p
        style="
          color:#6b7280;
          font-size:14px;
          line-height:1.6;
        "
      >
        If you did not request a password reset,
        you can safely ignore this email.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject: "SkillSync - Password Reset OTP",
    html,
  });
};

/*
|--------------------------------------------------------------------------
| Password Reset Successful
|--------------------------------------------------------------------------
*/

export const sendResetSuccessEmail = async (
  email
) => {
  const html = emailLayout({
    title: "Password Reset Successful",

    content: `
      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Your SkillSync password has been reset successfully.
      </p>

      <div
        style="
          margin:25px 0;
          padding:18px;
          background:#f0fdf4;
          border:1px solid #bbf7d0;
          border-radius:8px;
        "
      >
        <p
          style="
            margin:0;
            color:#166534;
            font-size:14px;
          "
        >
          Your account is now secured with your new password.
        </p>
      </div>

      <p
        style="
          color:#6b7280;
          font-size:14px;
          line-height:1.6;
        "
      >
        If you did not perform this action,
        please contact SkillSync support immediately.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject:
      "SkillSync - Password Reset Successful",
    html,
  });
};

/*
|--------------------------------------------------------------------------
| Password Changed While Logged In
|--------------------------------------------------------------------------
*/

export const sendPasswordChangedEmail = async (
  email
) => {
  const html = emailLayout({
    title: "Password Changed",

    content: `
      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Your SkillSync account password was changed successfully.
      </p>

      <div
        style="
          margin:25px 0;
          padding:18px;
          background:#fff7ed;
          border:1px solid #fed7aa;
          border-radius:8px;
        "
      >
        <p
          style="
            margin:0;
            color:#9a3412;
            font-size:14px;
            line-height:1.6;
          "
        >
          If you did not make this change,
          please contact SkillSync support immediately.
        </p>
      </div>
    `,
  });

  return sendEmail({
    to: email,
    subject:
      "SkillSync - Your Password Was Changed",
    html,
  });
};

/*
|--------------------------------------------------------------------------
| New Job Application - Client
|--------------------------------------------------------------------------
*/

export const sendApplicationEmail = async ({
  email,
  clientName,
  developerName,
  jobTitle,
}) => {
  const safeClientName =
    escapeHtml(clientName);

  const safeDeveloperName =
    escapeHtml(developerName);

  const safeJobTitle =
    escapeHtml(jobTitle);

  const html = emailLayout({
    title: "New Job Application",

    content: `
      <p style="font-size:15px;">
        Hello <strong>${safeClientName}</strong>,
      </p>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        A developer has submitted an application
        for your job posting.
      </p>

      <table
        style="
          width:100%;
          border-collapse:collapse;
          margin:25px 0;
        "
      >
        <tr>
          <td
            style="
              padding:12px;
              border:1px solid #e5e7eb;
              background:#f9fafb;
              font-weight:bold;
            "
          >
            Developer
          </td>

          <td
            style="
              padding:12px;
              border:1px solid #e5e7eb;
            "
          >
            ${safeDeveloperName}
          </td>
        </tr>

        <tr>
          <td
            style="
              padding:12px;
              border:1px solid #e5e7eb;
              background:#f9fafb;
              font-weight:bold;
            "
          >
            Job
          </td>

          <td
            style="
              padding:12px;
              border:1px solid #e5e7eb;
            "
          >
            ${safeJobTitle}
          </td>
        </tr>
      </table>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Log in to SkillSync to review the application
        and decide on the next steps.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject:
      "New Job Application - SkillSync",
    html,
  });
};

/*
|--------------------------------------------------------------------------
| Application Accepted - Developer
|--------------------------------------------------------------------------
*/

export const sendAcceptanceEmail = async ({
  email,
  developerName,
  jobTitle,
}) => {
  const safeDeveloperName =
    escapeHtml(developerName);

  const safeJobTitle =
    escapeHtml(jobTitle);

  const html = emailLayout({
    title: "Application Accepted",

    content: `
      <div
        style="
          padding:18px;
          background:#f0fdf4;
          border:1px solid #bbf7d0;
          border-radius:8px;
          margin-bottom:25px;
        "
      >
        <h3
          style="
            margin:0;
            color:#15803d;
          "
        >
          Congratulations ${safeDeveloperName}!
        </h3>
      </div>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        We are pleased to inform you that your application
        has been <strong>accepted</strong>.
      </p>

      <table
        style="
          width:100%;
          border-collapse:collapse;
          margin:25px 0;
        "
      >
        <tr>
          <td
            style="
              padding:12px;
              border:1px solid #e5e7eb;
              background:#f9fafb;
              font-weight:bold;
            "
          >
            Job
          </td>

          <td
            style="
              padding:12px;
              border:1px solid #e5e7eb;
            "
          >
            ${safeJobTitle}
          </td>
        </tr>
      </table>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Please log into SkillSync to view the next steps
        and communicate with the client.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject:
      "Congratulations! Your Application Was Accepted",
    html,
  });
};

/*
|--------------------------------------------------------------------------
| New Job Alert - Developer
|--------------------------------------------------------------------------
*/

export const sendNewJobAlertEmail = async ({
  email,
  developerName,
  jobTitle,
  category,
  budget,
  clientName,
}) => {
  const safeDeveloperName =
    escapeHtml(developerName);

  const safeJobTitle =
    escapeHtml(jobTitle);

  const safeCategory =
    escapeHtml(category);

  const safeBudget =
    escapeHtml(budget);

  const safeClientName =
    escapeHtml(clientName);

  const html = emailLayout({
    title: "New Job Available",

    content: `
      <p style="font-size:15px;">
        Hello <strong>${safeDeveloperName}</strong>,
      </p>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        A new project matching your skills has just been posted.
      </p>

      <table
        style="
          width:100%;
          border-collapse:collapse;
          margin:25px 0;
        "
      >
        <tr>
          <td style="padding:12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">
            Job
          </td>
          <td style="padding:12px;border:1px solid #e5e7eb;">
            ${safeJobTitle}
          </td>
        </tr>

        <tr>
          <td style="padding:12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">
            Category
          </td>
          <td style="padding:12px;border:1px solid #e5e7eb;">
            ${safeCategory}
          </td>
        </tr>

        <tr>
          <td style="padding:12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">
            Budget
          </td>
          <td style="padding:12px;border:1px solid #e5e7eb;">
            KES ${safeBudget}
          </td>
        </tr>

        <tr>
          <td style="padding:12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">
            Client
          </td>
          <td style="padding:12px;border:1px solid #e5e7eb;">
            ${safeClientName}
          </td>
        </tr>
      </table>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Log in to SkillSync to review the project
        and submit your application.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject:
      `New ${safeCategory} Job Available on SkillSync`,
    html,
  });
};

/*
|--------------------------------------------------------------------------
| Payment Confirmation - Client
|--------------------------------------------------------------------------
*/

export const sendPaymentConfirmationToClient =
  async ({
    email,
    clientName,
    jobTitle,
    amount,
  }) => {
    const safeClientName =
      escapeHtml(clientName);

    const safeJobTitle =
      escapeHtml(jobTitle);

    const safeAmount =
      escapeHtml(amount);

    const html = emailLayout({
      title: "Payment Successful",

      content: `
        <p style="font-size:15px;">
          Hello <strong>${safeClientName}</strong>,
        </p>

        <p
          style="
            font-size:15px;
            line-height:1.6;
          "
        >
          Your payment has been received successfully.
        </p>

        <table
          style="
            width:100%;
            border-collapse:collapse;
            margin:25px 0;
          "
        >
          <tr>
            <td style="padding:12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">
              Project
            </td>
            <td style="padding:12px;border:1px solid #e5e7eb;">
              ${safeJobTitle}
            </td>
          </tr>

          <tr>
            <td style="padding:12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">
              Amount Paid
            </td>
            <td style="padding:12px;border:1px solid #e5e7eb;">
              KES ${safeAmount}
            </td>
          </tr>
        </table>

        <div
          style="
            padding:18px;
            background:#f0fdf4;
            border:1px solid #bbf7d0;
            border-radius:8px;
          "
        >
          <p style="margin:0;color:#166534;">
            Your project has officially started.
          </p>
        </div>
      `,
    });

    return sendEmail({
      to: email,
      subject:
        "Payment Successful - SkillSync",
      html,
    });
  };

/*
|--------------------------------------------------------------------------
| Payment Received - Developer
|--------------------------------------------------------------------------
*/

export const sendPaymentReceivedEmail =
  async ({
    email,
    developerName,
    jobTitle,
    amount,
  }) => {
    const safeDeveloperName =
      escapeHtml(developerName);

    const safeJobTitle =
      escapeHtml(jobTitle);

    const safeAmount =
      escapeHtml(amount);

    const html = emailLayout({
      title: "Payment Received",

      content: `
        <p style="font-size:15px;">
          Hello <strong>${safeDeveloperName}</strong>,
        </p>

        <p
          style="
            font-size:15px;
            line-height:1.6;
          "
        >
          Good news! The client has successfully
          paid for your project.
        </p>

        <table
          style="
            width:100%;
            border-collapse:collapse;
            margin:25px 0;
          "
        >
          <tr>
            <td style="padding:12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">
              Project
            </td>
            <td style="padding:12px;border:1px solid #e5e7eb;">
              ${safeJobTitle}
            </td>
          </tr>

          <tr>
            <td style="padding:12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">
              Total Paid
            </td>
            <td style="padding:12px;border:1px solid #e5e7eb;">
              KES ${safeAmount}
            </td>
          </tr>
        </table>

        <p
          style="
            font-size:15px;
            line-height:1.6;
          "
        >
          Your earnings have been placed in your
          SkillSync Wallet and will become available
          after admin approval.
        </p>
      `,
    });

    return sendEmail({
      to: email,
      subject:
        "You've Been Paid - SkillSync",
      html,
    });
  };

/*
|--------------------------------------------------------------------------
| Payment Released - Developer
|--------------------------------------------------------------------------
*/

export const sendPaymentReleasedEmail =
  async ({
    email,
    developerName,
    amount,
  }) => {
    const safeDeveloperName =
      escapeHtml(developerName);

    const safeAmount =
      escapeHtml(amount);

    const html = emailLayout({
      title: "Payment Released",

      content: `
        <p style="font-size:15px;">
          Hello <strong>${safeDeveloperName}</strong>,
        </p>

        <p
          style="
            font-size:15px;
            line-height:1.6;
          "
        >
          Great news! Your payment has been approved
          by the SkillSync administrator.
        </p>

        <div
          style="
            margin:25px 0;
            padding:20px;
            background:#f0fdf4;
            border:1px solid #bbf7d0;
            border-radius:10px;
            text-align:center;
          "
        >
          <div
            style="
              color:#64748b;
              font-size:13px;
              margin-bottom:8px;
            "
          >
            Amount Released
          </div>

          <div
            style="
              color:#16a34a;
              font-size:30px;
              font-weight:700;
            "
          >
            KES ${safeAmount}
          </div>
        </div>

        <p
          style="
            font-size:15px;
            line-height:1.6;
          "
        >
          The money is now available in your
          SkillSync Wallet and can be withdrawn.
        </p>
      `,
    });

    return sendEmail({
      to: email,
      subject:
        "Payment Released - SkillSync",
      html,
    });
  };

/*
|--------------------------------------------------------------------------
| Withdrawal Approved - Developer
|--------------------------------------------------------------------------
*/

export const sendWithdrawalApprovedEmail =
  async ({
    email,
    developerName,
    amount,
  }) => {
    const safeDeveloperName =
      escapeHtml(developerName);

    const safeAmount =
      escapeHtml(amount);

    const html = emailLayout({
      title: "Withdrawal Approved",

      content: `
        <p style="font-size:15px;">
          Hello <strong>${safeDeveloperName}</strong>,
        </p>

        <p
          style="
            font-size:15px;
            line-height:1.6;
          "
        >
          Your withdrawal request has been approved.
        </p>

        <div
          style="
            margin:25px 0;
            padding:20px;
            background:#f0fdf4;
            border:1px solid #bbf7d0;
            border-radius:10px;
            text-align:center;
          "
        >
          <div
            style="
              color:#64748b;
              font-size:13px;
              margin-bottom:8px;
            "
          >
            Withdrawal Amount
          </div>

          <div
            style="
              color:#16a34a;
              font-size:30px;
              font-weight:700;
            "
          >
            KES ${safeAmount}
          </div>
        </div>

        <p
          style="
            font-size:15px;
            line-height:1.6;
          "
        >
          Your payment will be sent to your
          M-Pesa account shortly.
        </p>
      `,
    });

    return sendEmail({
      to: email,
      subject:
        "Withdrawal Approved - SkillSync",
      html,
    });
  };

/*
|--------------------------------------------------------------------------
| Withdrawal Rejected - Developer
|--------------------------------------------------------------------------
*/

export const sendWithdrawalRejectedEmail =
  async ({
    email,
    developerName,
    amount,
  }) => {
    const safeDeveloperName =
      escapeHtml(developerName);

    const safeAmount =
      escapeHtml(amount);

    const html = emailLayout({
      title: "Withdrawal Rejected",

      content: `
        <p style="font-size:15px;">
          Hello <strong>${safeDeveloperName}</strong>,
        </p>

        <p
          style="
            font-size:15px;
            line-height:1.6;
          "
        >
          Unfortunately, your withdrawal request
          was rejected.
        </p>

        <div
          style="
            margin:25px 0;
            padding:18px;
            background:#fef2f2;
            border:1px solid #fecaca;
            border-radius:8px;
          "
        >
          <p style="margin:0;color:#991b1b;">
            Withdrawal amount:
            <strong>KES ${safeAmount}</strong>
          </p>
        </div>

        <p
          style="
            font-size:15px;
            line-height:1.6;
          "
        >
          The money has been returned to your
          SkillSync Wallet.
        </p>
      `,
    });

    return sendEmail({
      to: email,
      subject:
        "Withdrawal Rejected - SkillSync",
      html,
    });
  };

/*
|--------------------------------------------------------------------------
| Application Rejected - Developer
|--------------------------------------------------------------------------
*/

export const sendRejectionEmail = async ({
  email,
  developerName,
  jobTitle,
}) => {
  const safeDeveloperName =
    escapeHtml(developerName);

  const safeJobTitle =
    escapeHtml(jobTitle);

  const html = emailLayout({
    title: "Application Update",

    content: `
      <p style="font-size:15px;">
        Hello <strong>${safeDeveloperName}</strong>,
      </p>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Thank you for applying for the
        <strong>${safeJobTitle}</strong>
        project on SkillSync.
      </p>

      <div
        style="
          margin:25px 0;
          padding:18px;
          background:#fef2f2;
          border:1px solid #fecaca;
          border-radius:8px;
        "
      >
        <p
          style="
            margin:0;
            color:#991b1b;
            font-size:14px;
            line-height:1.6;
          "
        >
          Unfortunately, your application was not
          selected for this project.
        </p>
      </div>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Don't be discouraged. Keep applying for
        other opportunities on SkillSync.
      </p>

      <p
        style="
          font-size:15px;
          line-height:1.6;
        "
      >
        Best regards,<br />
        <strong>SkillSync Team</strong>
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject:
      `Application Update - ${safeJobTitle}`,
    html,
  });
};
