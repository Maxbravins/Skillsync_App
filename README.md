# SkillSync — Freelance Developer Marketplace

A full-stack MERN application connecting student developers with clients. Clients post jobs, developers apply with cover letters, and payments are handled via M-Pesa and a built-in wallet system.

**Live demo:** [skillsync-app-three.vercel.app](https://skillsync-app-three.vercel.app)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [API overview](#api-overview)
- [Roles and permissions](#roles-and-permissions)
- [Authentication flow](#authentication-flow)
- [Known issues and security notes](#known-issues-and-security-notes)
- [Contributing](#contributing)

---

## Features

- User registration and login (client, developer, admin roles)
- Role-based dashboards — clients post jobs, developers apply
- Job posting with full CRUD
- Job applications with cover letters and status tracking
- User profiles with avatar upload, skills, experience, portfolio links
- OTP-based password reset via email
- M-Pesa STK Push integration for payments (Kenya)
- Developer wallet — receive funds, request withdrawals
- Platform payment and premium subscription system
- PDF contract generation and download
- Admin panel — manage users, jobs, categories, wallets, and withdrawals
- In-app notification system
- Category-based developer filtering

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js (ES Modules) |
| Database | MongoDB Atlas (Mongoose ODM) |
| Authentication | JWT (Bearer token) + OTP via email |
| File uploads | Multer (local disk storage) |
| Payments | M-Pesa Daraja API |
| Email | Nodemailer (or configured SMTP service) |
| Deployment | Vercel (frontend), Railway / Render (backend) |

---

## Project structure

\`\`\`
Skillsync_App/
├── backend/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   └── multer.js
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── error.middleware.js
│   │   ├── pagination.js
│   │   └── upload.middleware.js
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   └── email.service.js
│   └── uploads/
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── context/
        ├── hooks/
        └── utils/
\`\`\`

---

## Getting started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- Git
- A MongoDB Atlas account (free tier is fine)

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/Maxbravins/Skillsync_App.git
cd Skillsync_App
\`\`\`

### 2. Set up the backend

\`\`\`bash
cd backend
npm install
cp .env.example .env
\`\`\`

### 3. Set up the frontend

\`\`\`bash
cd ../frontend
npm install
\`\`\`

Create \`frontend/.env\`:

\`\`\`
VITE_API_URL=http://localhost:5000
\`\`\`

---

## Environment variables

Create \`backend/.env\` with the following:

\`\`\`env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/skillsync
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_WEBHOOK_SECRET=generate_with_openssl_rand_hex_32
MPESA_CALLBACK_URL=https://your-backend-url.com/api/mpesa/callback/<MPESA_WEBHOOK_SECRET>
MPESA_B2C_RESULT_URL=https://your-backend-url.com/api/withdrawals/b2c/result/<MPESA_WEBHOOK_SECRET>
MPESA_B2C_TIMEOUT_URL=https://your-backend-url.com/api/withdrawals/b2c/timeout/<MPESA_WEBHOOK_SECRET>
\`\`\`

### M-Pesa webhook security

Safaricom callbacks are authenticated by a secret embedded in the callback URL. Generate one with `openssl rand -hex 32` (at least 24 URL-safe characters), set it as `MPESA_WEBHOOK_SECRET`, and append it to the three callback URLs above. Requests to a callback path with a missing or wrong secret are rejected with 403, and if the secret is not configured the endpoints refuse all callbacks (503) outside `NODE_ENV=development`. Optionally set `MPESA_ALLOWED_IPS` (comma-separated Safaricom IPs from the Daraja docs) to enforce an IP allowlist as well. **Rotate the secret and re-register the URLs if it ever appears in logs.**

---

## Running the app

**Backend:**

\`\`\`bash
cd backend
npm run dev
\`\`\`

### Presentation data (local or staging only)

Use a non-production database and set NODE_ENV=development, ENABLE_DEMO_SEED=true, MONGO_URI, and DEMO_SEED_PASSWORD (at least 8 characters) in backend/.env. From the backend folder, run npm run seed:demo.

This creates a demo client, a demo developer, two clearly labeled sample listings, and one sample application. Both accounts use the DEMO_SEED_PASSWORD value. The script refuses to run when NODE_ENV=production; do not point it at a production database.

**Frontend:**

\`\`\`bash
cd frontend
npm run dev
\`\`\`

---

## API overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/register | None | Register new user |
| POST | /auth/login | None | Login and receive JWT |
| GET | /auth/me | Required | Get current user |
| POST | /auth/forgot-password | None | Send OTP to email |
| POST | /auth/verify-otp | None | Verify OTP |
| POST | /auth/reset-password | None | Set new password |
| GET | /jobs | None | List all jobs |
| POST | /jobs | Client | Create a job |
| POST | /applications | Developer | Apply to a job |
| GET | /dashboard | Required | Role dashboard data |
| GET | /wallet | Developer | Get wallet balance |
| POST | /withdrawals | Developer | Request withdrawal |
| GET | /admin/users | Admin | Manage all users |

---

## Roles and permissions

| Role | What they can do |
|---|---|
| client | Post jobs, view applications, hire developers, make payments |
| developer | Browse jobs, apply, manage profile, receive wallet payments |
| admin | Full access — manage users, categories, withdrawals, platform payments |

---

## Authentication flow

\`\`\`
Register → JWT returned → store in frontend
Every request → Authorization: Bearer <token>
Token expires (7 days) → user must log in again

Forgot password:
  POST /auth/forgot-password (email) → OTP sent
  POST /auth/verify-otp (email + otp) → resetToken returned
  POST /auth/reset-password (resetToken + newPassword) → done
\`\`\`

---

## Known issues and security notes

- Rate limiting not yet applied to auth routes
- Uploaded files under /uploads are publicly accessible without authentication
- Route-level input validation (zod/express-validator) is planned
- Helmet.js HTTP security headers not yet added

---

## License

This project is for educational purposes. All rights reserved — Maxbravins / SkillSync 2024.
