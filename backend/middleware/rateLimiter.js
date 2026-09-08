// backend/middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

// General API limiter — all routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again in 15 minutes.",
  },
});

// Strict limiter — login and register
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again in 15 minutes.",
  },
});

// Very strict — forgot password and OTP (prevent OTP brute-force)
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests, please try again in 1 hour.",
  },
});

// Financial limiter — withdrawals and payment initiation.
// Tighter than the general API limiter: these endpoints move real
// money, so we want to slow down automated abuse/spam attempts even
// from an authenticated, otherwise-legitimate-looking session.
export const financialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many payment/withdrawal requests, please slow down and try again shortly.",
  },
});

// Webhook limiter — M-Pesa callbacks (very permissive)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Very high limit for webhooks
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful webhooks
  skipFailedRequests: true, // Don't count failed webhooks
  message: {
    success: false,
    message: "Webhook rate limit exceeded.",
  },
});