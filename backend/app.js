import express from "express";
import cors from "cors";
import { apiLimiter } from "./middleware/rateLimiter.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import path from "path";
import mpesaRoutes from "./routes/mpesa.routes.js";
import { fileURLToPath } from "url";
import pdfRoutes from "./routes/pdf.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import platformPaymentRoutes from "./routes/platformPayment.routes.js";
import premiumRoutes from "./routes/premium.routes.js";
import contractRoutes from "./routes/contract.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import withdrawalRoutes from "./routes/withdrawal.routes.js";
import adminWalletRoutes from "./routes/adminWallet.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/skillsync-app.*\.vercel\.app$/.test(origin) ||
        /^https:\/\/skillsync.*mikanenas-projects\.vercel\.app$/.test(origin);

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/platform-payment", platformPaymentRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/admin-wallet", adminWalletRoutes);
app.use("/api/premium", premiumRoutes);

// Home route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to SkillSync API",
  });
});

// Error handling middleware (must be registered after all routes)
app.use(errorHandler);

export default app;