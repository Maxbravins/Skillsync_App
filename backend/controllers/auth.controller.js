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

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      category: selectedCategory?._id || null,
    });

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

    res.clearCookie(
      REFRESH_COOKIE_NAME,
      refreshCookieOptions()
    );

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

    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account exists for this email, a password reset OTP has been sent.",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await OTP.deleteMany({
      email: normalizedEmail,
    });

    await OTP.create({
      email: normalizedEmail,
      otp,
      expiresAt,
      attempts: 0,
    });

    const emailResult = await sendOTP(
      normalizedEmail,
      otp
    );

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

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

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

    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    const resetToken = crypto.randomBytes(32).toString("hex");

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

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

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

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

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

    const user = await User.findById(
      req.user.id
    ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    user.refreshTokens = [];

    await user.save();

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

// Exchange a refresh-token cookie for a new access token.
// The refresh token is single-use and is rotated on success.
export const refreshAccessToken = async (req, res) => {
  try {
    const rawRefreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME];

    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const user = await User.findOne({
      "refreshTokens.tokenHash": tokenHash,
    }).select("+refreshTokens");

    if (!user) {
      res.clearCookie(
        REFRESH_COOKIE_NAME,
        refreshCookieOptions()
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired session. Please log in again.",
      });
    }

    const isValid = await consumeRefreshToken(
      user,
      rawRefreshToken
    );

    if (!isValid) {
      await revokeAllRefreshTokens(user);

      res.clearCookie(
        REFRESH_COOKIE_NAME,
        refreshCookieOptions()
      );

      return res.status(401).json({
        success: false,
        message:
          "Session invalid. Please log in again.",
      });
    }

    /*
     * issueSession() creates a NEW refresh token and saves
     * the user. The old refresh token was removed above.
     */
    const accessToken = await issueSession(
      req,
      res,
      user
    );

    return res.status(200).json({
      success: true,
      token: accessToken,
    });
  } catch (error) {
    console.error(
      "========== REFRESH TOKEN ERROR =========="
    );
    console.error("Name:", error?.name);
    console.error("Message:", error?.message);
    console.error("Stack:", error?.stack);
    console.error(
      "=========================================="
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to refresh authentication session",
    });
  }
};
