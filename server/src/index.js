require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();

connectDB();

// helmet sets secure HTTP response headers (X-Frame-Options, CSP, HSTS, etc.)
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true, // required for cookies to be sent cross-origin
}));

app.use(express.json({ limit: '10kb' })); // limit body size to prevent DoS
app.use(cookieParser());

// Broad rate limit for all routes — auth routes have their own stricter limits
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api/auth', authRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
