import crypto from "crypto";
import jwt from "jsonwebtoken";

// ============================================================
// ACCESS TOKEN (short-lived, sent in the JSON body, kept
// in memory on the frontend — never persisted to localStorage)
// ============================================================

const ACCESS_TOKEN_TTL = "15m";

export const signAccessToken = (user) =>
  jwt.sign(
    {
      id: user._id ?? user.id,
      role: user.role,
      type: "access",
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

// ============================================================
// REFRESH TOKEN (long-lived, opaque random value)
//
// The raw value is only ever sent to the client once, inside an
// HttpOnly/Secure/SameSite cookie. The database only ever stores
// a SHA-256 hash of it, the same pattern already used for the
// password-reset token in this codebase.
// ============================================================

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const REFRESH_COOKIE_NAME = "refreshToken";

export const generateRefreshToken = () =>
  crypto.randomBytes(48).toString("hex");

export const hashRefreshToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

export const refreshTokenExpiry = () =>
  new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_TTL_MS,
});

// Cap the number of concurrent sessions/devices per user so a
// stolen-but-unused refresh token can't accumulate forever.
const MAX_ACTIVE_SESSIONS = 5;

/**
 * Issue a new refresh token for a user, store its hash, and prune
 * expired / excess entries. Returns the RAW token (only time it
 * exists outside the cookie).
 */
export const issueRefreshToken = async (user, userAgent = "") => {
  const rawToken = generateRefreshToken();

  const entry = {
    tokenHash: hashRefreshToken(rawToken),
    expiresAt: refreshTokenExpiry(),
    createdAt: new Date(),
    userAgent: (userAgent || "").slice(0, 200),
  };

  const now = new Date();

  user.refreshTokens = (user.refreshTokens || [])
    .filter((t) => t.expiresAt > now)
    .slice(-(MAX_ACTIVE_SESSIONS - 1));

  user.refreshTokens.push(entry);

  await user.save({ validateBeforeSave: false });

  return rawToken;
};

/**
 * Validate a presented raw refresh token against the stored hashes
 * for that user, removing it (rotation: single use). Returns true
 * if it was found and valid, false otherwise.
 */
export const consumeRefreshToken = async (user, rawToken) => {
  const tokenHash = hashRefreshToken(rawToken);
  const now = new Date();

  const tokens = user.refreshTokens || [];
  const match = tokens.find(
    (t) => t.tokenHash === tokenHash && t.expiresAt > now
  );

  // Always drop expired tokens while we're here.
  user.refreshTokens = tokens.filter((t) => t.expiresAt > now);

  if (!match) {
    return false;
  }

  // Single-use: remove the token that was just presented.
  user.refreshTokens = user.refreshTokens.filter(
    (t) => t.tokenHash !== tokenHash
  );

  return true;
};

/** Revoke every refresh token for a user (logout everywhere, password change, reuse detected). */
export const revokeAllRefreshTokens = async (user) => {
  user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });
};

/** Revoke a single refresh token (normal logout on one device). */
export const revokeRefreshToken = async (user, rawToken) => {
  if (!rawToken) return;
  const tokenHash = hashRefreshToken(rawToken);
  user.refreshTokens = (user.refreshTokens || []).filter(
    (t) => t.tokenHash !== tokenHash
  );
  await user.save({ validateBeforeSave: false });
};
