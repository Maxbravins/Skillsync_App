import express from "express";
import cors from "cors";
import { apiLimiter, webhookLimiter } from "./middleware/rateLimiter.js";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import mpesaRoutes from "./routes/mpesa.routes.js";
import pdfRoutes from "./routes/pdf.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import platformPaymentRoutes from "./routes/platformPayment.routes.js";
import premiumRoutes from "./routes/premium.routes.js";
import contractRoutes from "./routes/contract.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import withdrawalRoutes from "./routes/withdrawal.routes.js";
import adminWalletRoutes from "./routes/adminWallet.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

// CORS CONFIGURATION
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "https://skillsync-app-three.vercel.app",
  // Add exact production domains here instead of regex
];

// Also allow Vercel preview deployments (more restrictive)
const isVercelPreview = (origin) => {
  if (!origin) return false;
  // Match only your specific Vercel subdomain pattern
  return /^https:\/\/skillsync-app-[a-zA-Z0-9]+\.vercel\.app$/.test(origin) ||
         /^https:\/\/skillsync-[a-zA-Z0-9]+\.vercel\.app$/.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.includes(origin) || isVercelPreview(origin);

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn(`CORS blocked: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// BODY PARSER
app.use(express.json({ limit: "10mb" }));
// Webhooks FIRST (must be processed before rate limiting)

app.use("/api/mpesa", mpesaRoutes);

// RATE LIMITING (applied to API routes AFTER webhooks)
app.use("/api", apiLimiter);

// PROTECTED ROUTES (with rate limiting)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/platform-payment", platformPaymentRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/admin-wallet", adminWalletRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/upload", uploadRoutes);

// HOME ROUTE
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to SkillSync API",
    version: "1.0.0",
  });
});

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || "development",
  });
});

  // 404 HANDLER (BEFORE error handler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ERROR HANDLER (must be last)
app.use(errorHandler);

export default app;