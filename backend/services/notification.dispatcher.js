import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { sendEmail } from "./email.service.js";

const CATEGORY_BY_TYPE = {
  job_application: "applications",
  application_accepted: "applications",
  application_rejected: "applications",
  application_shortlisted: "applications",
  application_viewed: "applications",

  message: "messages",
  new_message: "messages",

  job_match: "jobMatches",
  job_recommendation: "jobMatches",

  contract_created: "contracts",
  contract_updated: "contracts",
  contract_accepted: "contracts",
  contract_completed: "contracts",

  payment_success: "payments",
  payment_failed: "payments",
  escrow_funded: "payments",
  escrow_released: "payments",
  escrow_refunded: "payments",
  refund: "payments",
  milestone_completed: "payments",
  milestone_approved: "payments",
  milestone_released: "payments",

  withdrawal_requested: "withdrawals",
  withdrawal_success: "withdrawals",
  withdrawal_failed: "withdrawals",

  premium_activated: "premium",
  premium_expiring: "premium",
  premium_expired: "premium",

  marketing: "marketing",
};

const ALWAYS_EMAIL_TYPES = new Set([
  "security_password_reset",
  "security_password_changed",
  "email_verification",
]);

const getEmailPreference = (user, type) => {
  if (ALWAYS_EMAIL_TYPES.has(type)) {
    return true;
  }

  const category = CATEGORY_BY_TYPE[type];

  if (!category) {
    return true;
  }

  const preferences =
    user?.notificationPreferences?.email || {};

  if (typeof preferences[category] === "boolean") {
    return preferences[category];
  }

  // Existing SkillSync preferences
  if (category === "jobMatches") {
    return preferences.jobMatches !== false;
  }

  if (category === "applications") {
    return preferences.applicationUpdates !== false;
  }

  if (
    category === "payments" ||
    category === "withdrawals" ||
    category === "premium"
  ) {
    return preferences.paymentUpdates !== false;
  }

  if (category === "marketing") {
    return preferences.marketing === true;
  }

  return true;
};

const buildEmailHtml = ({
  title,
  message,
  actionUrl,
  actionText = "Open SkillSync",
}) => {
  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeActionText = escapeHtml(actionText);
  const safeActionUrl = actionUrl
    ? escapeHtml(actionUrl)
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>${safeTitle}</title>
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
            "
          >
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
                "
              >
                SkillSync
              </h1>
            </div>

            <div style="padding:30px 25px;">
              <h2
                style="
                  margin-top:0;
                  color:#111827;
                  font-size:22px;
                "
              >
                ${safeTitle}
              </h2>

              <p
                style="
                  font-size:15px;
                  line-height:1.7;
                "
              >
                ${safeMessage}
              </p>

              ${
                safeActionUrl
                  ? `
                    <div
                      style="
                        margin:28px 0;
                        text-align:center;
                      "
                    >
                      <a
                        href="${safeActionUrl}"
                        style="
                          display:inline-block;
                          background:#06b6d4;
                          color:#ffffff;
                          text-decoration:none;
                          padding:12px 20px;
                          border-radius:8px;
                          font-weight:700;
                        "
                      >
                        ${safeActionText}
                      </a>
                    </div>
                  `
                  : ""
              }
            </div>

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
                © 2026 SkillSync. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const notifyUser = async ({
  userId,
  type,
  title,
  message,
  data = {},
  priority = "normal",
  expiresAt = null,
  email = null,
}) => {
  if (!userId) {
    throw new Error("Notification userId is required");
  }

  if (!type) {
    throw new Error("Notification type is required");
  }

  if (!title) {
    throw new Error("Notification title is required");
  }

  if (!message) {
    throw new Error("Notification message is required");
  }

  // 1. Create the in-app notification.
  const notification = await Notification.create({
    recipient: userId,
    type,
    title,
    message,
    data,
    priority,
    expiresAt,
    isRead: false,
  });

  let emailResult = null;

  // 2. Send email only when this event requests one.
  if (email) {
    const user = await User.findById(userId)
      .select("email notificationPreferences")
      .lean();

    if (!user?.email) {
      emailResult = {
        success: false,
        skipped: true,
        reason: "missing_recipient",
      };
    } else if (!getEmailPreference(user, type)) {
      emailResult = {
        success: false,
        skipped: true,
        reason: "disabled_by_preference",
      };
    } else {
      emailResult = await sendEmail({
        to: user.email,
        subject:
          email.subject ||
          `SkillSync - ${title}`,
        html:
          email.html ||
          buildEmailHtml({
            title,
            message,
            actionUrl: email.actionUrl,
            actionText: email.actionText,
          }),
      });
    }
  }

  return {
    notification,
    email: emailResult,
  };
};

export { CATEGORY_BY_TYPE };

export default notifyUser;