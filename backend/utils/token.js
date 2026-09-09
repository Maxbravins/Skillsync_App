import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// ============================================================
// ACCESS TOKEN
// ============================================================

const ACCESS_TOKEN_TTL = "15m";

export const signAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id ?? user.id,
      role: user.role,
      type: "access",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_TTL,
    }
  );
};

// ============================================================
// REFRESH TOKEN
// ============================================================

const REFRESH_TOKEN_TTL_MS =
  7 * 24 * 60 * 60 * 1000;

export const REFRESH_COOKIE_NAME =
  "refreshToken";

export const generateRefreshToken = () =>
  crypto.randomBytes(48).toString("hex");

export const hashRefreshToken = (rawToken) => {
  if (!rawToken) {
    throw new Error("Refresh token is required");
  }

  return crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
};

export const refreshTokenExpiry = () =>
  new Date(
    Date.now() + REFRESH_TOKEN_TTL_MS
  );

// ============================================================
// REFRESH COOKIE
// ============================================================

export const refreshCookieOptions = () => ({
  httpOnly: true,

  // HTTPS is required in production.
  secure:
    process.env.NODE_ENV === "production",

  // Required when frontend and backend are on different origins.
  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",

  // Must match the authentication routes.
  path: "/api/auth",

  maxAge: REFRESH_TOKEN_TTL_MS,
});

// ============================================================
// SESSION LIMIT
// ============================================================

const MAX_ACTIVE_SESSIONS = 5;

// ============================================================
// ISSUE REFRESH TOKEN
// ============================================================

export const issueRefreshToken = async (
  user,
  userAgent = ""
) => {
  if (!user) {
    throw new Error(
      "Cannot issue refresh token without a user"
    );
  }

  const rawToken =
    generateRefreshToken();

  const now = new Date();

  const entry = {
    tokenHash:
      hashRefreshToken(rawToken),

    expiresAt:
      refreshTokenExpiry(),

    createdAt: now,

    userAgent:
      (userAgent || "").slice(0, 200),
  };

  await User.findByIdAndUpdate(
    user._id,
    [
      {
        $set: {
          refreshTokens: {
            $concatArrays: [
              {
                $slice: [
                  {
                    $filter: {
                      input: {
                        $ifNull: [
                          "$refreshTokens",
                          [],
                        ],
                      },

                      as: "token",

                      cond: {
                        $and: [
                          {
                            $ne: [
                              "$$token.expiresAt",
                              null,
                            ],
                          },
                          {
                            $gt: [
                              "$$token.expiresAt",
                              now,
                            ],
                          },
                        ],
                      },
                    },
                  },

                  -(MAX_ACTIVE_SESSIONS - 1),
                ],
              },

              [entry],
            ],
          },
        },
      },
    ]
  );

  return rawToken;
};

// ============================================================
// CONSUME REFRESH TOKEN
// ============================================================

export const consumeRefreshToken = async (
  user,
  rawToken
) => {
  if (!user || !rawToken) {
    return false;
  }

  const tokenHash =
    hashRefreshToken(rawToken);

  const now = new Date();

  const result =
    await User.updateOne(
      {
        _id: user._id,

        refreshTokens: {
          $elemMatch: {
            tokenHash,
            expiresAt: {
              $gt: now,
            },
          },
        },
      },
      {
        $pull: {
          refreshTokens: {
            tokenHash,
          },
        },
      }
    );

  return result.matchedCount === 1;
};

// ============================================================
// REVOKE ALL REFRESH TOKENS
// ============================================================

export const revokeAllRefreshTokens =
  async (user) => {
    if (!user) return;

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          refreshTokens: [],
        },
      }
    );
  };

// ============================================================
// REVOKE ONE REFRESH TOKEN
// ============================================================

export const revokeRefreshToken =
  async (user, rawToken) => {
    if (!user || !rawToken) {
      return;
    }

    const tokenHash =
      hashRefreshToken(rawToken);

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $pull: {
          refreshTokens: {
            tokenHash,
          },
        },
      }
    );
  };
