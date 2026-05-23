# AuthApp — Full-Stack Authentication System

A production-ready authentication system built with React, Express, and MongoDB. Covers the full auth lifecycle: registration, email verification, login, token refresh, password reset, and account lockout.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Email | Nodemailer (Ethereal for dev, any SMTP for prod) |
| Security | Helmet, express-rate-limit, express-validator |

---

## Features

- **Registration** with email verification (24-hour link)
- **Login** with JWT access token (15 min) + refresh token (7 days, HTTP-only cookie)
- **Refresh token rotation** — each use issues a new token; reuse triggers full session invalidation
- **Password reset** via email (1-hour link)
- **Account lockout** after 5 failed login attempts (2-hour cooldown)
- **Token stored in memory** (not localStorage) — survives refresh via cookie, immune to XSS
- **Rate limiting** per endpoint per IP
- **Helmet** security headers (CSP, HSTS, X-Frame-Options, etc.)
- Passwords hashed with **bcrypt cost factor 12**
- SHA-256 hashed tokens in DB — a breach cannot replay raw tokens

---

## Project Structure

```
├── server/                    # Express API
│   ├── src/
│   │   ├── config/db.js       # MongoDB connection
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # JWT auth, input validation
│   │   ├── models/User.js     # Mongoose schema + lockout logic
│   │   ├── routes/auth.js     # Auth endpoints + rate limits
│   │   └── utils/             # Token helpers, email sender
│   ├── .env.example
│   └── package.json
└── src/                       # React app
    ├── api/
    │   ├── axios.js            # Instance with silent token-refresh interceptor
    │   └── tokenStore.js       # In-memory access token (not localStorage)
    ├── contexts/AuthContext.js # Session restore on mount, forced logout handler
    ├── components/
    │   ├── Navbar.js
    │   └── ProtectedRoute.js
    ├── pages/
    │   ├── Login.js
    │   ├── Register.js
    │   ├── Dashboard.js
    │   ├── ForgotPassword.js
    │   ├── ResetPassword.js
    │   └── VerifyEmail.js
    └── styles/auth.css
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB — install with Homebrew:
  ```bash
  brew tap mongodb/brew && brew install mongodb-community
  brew services start mongodb/brew/mongodb-community
  ```

### 1. Clone and install

```bash
git clone https://github.com/Dima-Vasilyev/simple-react-app.git
cd simple-react-app

npm install                        # frontend deps
cd server && npm install           # backend deps
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in:

```env
MONGODB_URI=mongodb://localhost:27017/auth-app

# Generate each with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_ACCESS_SECRET=<random 64-char hex>
JWT_REFRESH_SECRET=<different random 64-char hex>

# Free test SMTP — create an account at https://ethereal.email
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=<ethereal user>
EMAIL_PASS=<ethereal pass>
EMAIL_FROM=noreply@authapp.dev
EMAIL_FROM_NAME=AuthApp

CLIENT_URL=http://localhost:3000
```

### 3. Start

```bash
# Terminal 1 — API on port 5001
cd server && npm run dev

# Terminal 2 — React on port 3000
npm start
```

Open [http://localhost:3000](http://localhost:3000). The React dev server proxies all `/api/*` requests to Express — no CORS configuration needed in development.

---

## API Reference

All routes are prefixed `/api/auth`.

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Create account, send verification email |
| `POST` | `/login` | — | Returns access token + sets refresh cookie |
| `POST` | `/refresh` | Cookie | Rotate refresh token, return new access token |
| `POST` | `/logout` | Cookie | Invalidate refresh token, clear cookie |
| `GET` | `/me` | Bearer | Return current user |
| `GET` | `/verify-email?token=` | — | Verify email address |
| `POST` | `/resend-verification` | — | Re-send verification email |
| `POST` | `/forgot-password` | — | Send password reset email |
| `POST` | `/reset-password` | — | Set new password, invalidate all sessions |

### Rate limits

| Endpoint group | Limit |
|---|---|
| Auth endpoints | 10 requests / 15 min / IP |
| Password reset | 5 requests / 1 hr / IP |
| Global | 200 requests / 15 min / IP |

---

## Password Requirements

Minimum 8 characters including at least one of each:
- Uppercase letter (A–Z)
- Lowercase letter (a–z)
- Number (0–9)
- Special character (`@$!%*?&`)

---

## Production Checklist

- [ ] Set `NODE_ENV=production` — enables the `Secure` flag on the refresh-token cookie
- [ ] Use a Redis-backed rate limiter (`rate-limit-redis`) so limits survive restarts
- [ ] Replace Ethereal with a real SMTP provider (SendGrid, Postmark, AWS SES)
- [ ] Build and serve the React app — `npm run build` then serve `build/` statically
- [ ] Set `CLIENT_URL` to your production domain for CORS and email links
