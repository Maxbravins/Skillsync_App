import bcrypt from "bcryptjs";
import crypto from "crypto";
import OTP from "../models/OTP.model.js";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import {
  sendOTP,
  sendResetSuccessEmail,
  sendPasswordChangedEmail,
} from "../services/email.service.js";
import Wallet from "../models/wallet.model.js";
import {
  signAccessToken,
  issueRefreshToken,
  consumeRefreshToken,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  refreshCookieOptions,
  REFRESH_COOKIE_NAME,
} from "../utils/token.js";

// Issue an access token + rotate/set a refresh-token cookie for a user.
const issueSession = async (req, res, user) => {
  const accessToken = signAccessToken(user);
  const rawRefreshToken = await issueRefreshToken(
    user,
    req.headers["user-agent"]
  );

  res.cookie(
    REFRESH_COOKIE_NAME,
    rawRefreshToken,
    refreshCookieOptions()
  );

  return accessToken;
};

// Register user
export const registerUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      category,
    } = req.body;

    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be created via registration.",
      });
    }

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password || !username || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, email, password, and role are required.",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Developers must choose a category
    let selectedCategory = null;

    if (role === "developer") {
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Developer category is required.",
        });
      }

      selectedCategory = await Category.findById(category);

      if (!selectedCategory) {
        return res.status(404).json({
          success: false,
          message: "Invalid category selected.",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      category: selectedCategory?._id || null,
    });

    // Create wallet for developers
    if (user.role === "developer") {
      await Wallet.create({
        developer: user._id,
      });
    }

    const accessToken = await issueSession(req, res, user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        category: user.category,
      },
    });
  } catch (error) {
    console.error("Register user error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = await issueSession(req, res, user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        category: user.category,
      },
    });
  } catch (error) {
    console.error("Login user error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (rawRefreshToken && req.user?.id) {
      const user = await User.findById(req.user.id).select(
        "+refreshTokens"
      );

      if (user) {
        await revokeRefreshToken(user, rawRefreshToken);
      }
    }

    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get me error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Request password reset OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    /*
     * Do not reveal whether the account exists.
     * This prevents account enumeration.
     */
    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account exists for this email, a password reset OTP has been sent.",
      });
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // OTP expires after 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Remove previous OTPs for this email
    await OTP.deleteMany({
      email: normalizedEmail,
    });

    // Save new OTP
    await OTP.create({
      email: normalizedEmail,
      otp,
      expiresAt,
      attempts: 0,
    });

    // Send OTP email
    const emailResult = await sendOTP(
      normalizedEmail,
      otp
    );

    /*
     * If email delivery fails, remove the OTP.
     * Otherwise the user would have a valid OTP
     * that they never received.
     */
    if (!emailResult?.success) {
      await OTP.deleteMany({
        email: normalizedEmail,
      });

      console.error(
        "Password reset OTP email failed:",
        emailResult
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send password reset email. Please try again later.",
      });
    }

    return res.json({
      success: true,
      message:
        "If an account exists for this email, a password reset OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to process password reset request.",
    });
  }
};

// Verify password reset OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedOTP = otp?.trim();

    if (!normalizedEmail || !normalizedOTP) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(normalizedOTP)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be a 6-digit number.",
      });
    }

    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    // Check expiry
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    // Maximum failed attempts
    const MAX_OTP_ATTEMPTS = 5;

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // Compare submitted OTP
    if (otpRecord.otp !== normalizedOTP) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      const remainingAttempts =
        MAX_OTP_ATTEMPTS - otpRecord.attempts;

      if (remainingAttempts <= 0) {
        await OTP.deleteOne({
          _id: otpRecord._id,
        });

        return res.status(400).json({
          success: false,
          message:
            "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt${
          remainingAttempts === 1 ? "" : "s"
        } remaining.`,
      });
    }

    /*
     * OTP is correct.
     * Delete it immediately so it cannot be reused.
     */
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the hash in the database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await User.findOneAndUpdate(
      {
        email: normalizedEmail,
      },
      {
        resetPasswordToken: hashedToken,
        resetPasswordExpires:
          Date.now() + 15 * 60 * 1000,
      }
    );

    return res.json({
      success: true,
      message: "OTP verified",
      resetToken,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to verify OTP.",
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Validate input
    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Hash reset token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Find user with a valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // Update only password and reset-token fields, and revoke every
    // existing session — a reset password is a strong signal the
    // account may have been compromised, so all devices should be
    // forced to log in again with the new password.
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          refreshTokens: [],
        },
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpires: 1,
        },
      }
    );

    // Send confirmation email
    const emailResult =
      await sendResetSuccessEmail(user.email);

    if (!emailResult?.success) {
      console.error(
        "Password reset confirmation email failed:",
        emailResult
      );
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to reset password",
    });
  }
};

// Change password while logged in
export const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long.",
      });
    }

    // Get user with password
    const user = await User.findById(
      req.user.id
    ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Current password is incorrect",
      });
    }

    // Prevent reusing current password
    const isSamePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password.",
      });
    }

    // Hash new password and revoke every existing session so a
    // stolen access/refresh token from before the change stops
    // working immediately.
    user.password = await bcrypt.hash(
      newPassword,
      10
    );
    user.refreshTokens = [];

    await user.save();

    /*
     * Security notification.
     * Email failure should NOT make the password
     * change itself fail.
     */
    if (sendPasswordChangedEmail) {
      const emailResult =
        await sendPasswordChangedEmail(
          user.email
        );

      if (!emailResult?.success) {
        console.error(
          "Password changed email failed:",
          emailResult
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to change password",
    });
  }
};

// Exchange a refresh-token cookie for a new access token, rotating
// the refresh token itself (single use — old value stops working).
export const refreshAccessToken = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    // We don't know the user id yet (the cookie is opaque), so we
    // have to search. This is a small, infrequent, indexed-by-hash
    // lookup — acceptable at this scale.
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const user = await User.findOne({
      "refreshTokens.tokenHash": tokenHash,
    }).select("+refreshTokens");

    if (!user) {
      // Unknown token: either expired/rotated-away already, or
      // never valid. Clear the cookie either way.
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());

      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
      });
    }

    const isValid = await consumeRefreshToken(user, rawRefreshToken);

    if (!isValid) {
      // Token existed on the user but was expired, or (more
      // seriously) has already been used once before — that's a
      // sign of token theft/replay. Revoke every session for this
      // user as a precaution and force re-login everywhere.
      await revokeAllRefreshTokens(user);
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());

      return res.status(401).json({
        success: false,
        message: "Session invalid. Please log in again.",
      });
    }

    const accessToken = await issueSession(req, res, user);

    res.status(200).json({
      success: true,
      token: accessToken,
    });
  } catch (error) {
    console.error(
      "Refresh token error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to refresh token",
    });
  }
};
