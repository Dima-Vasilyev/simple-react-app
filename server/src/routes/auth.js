const express = require('express');
const { body, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  register, login, refresh, logout,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
  getMe,
} = require('../controllers/authController');

const router = express.Router();

// 10 requests per 15 minutes per IP on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for password reset (5 per hour)
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many reset attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password must contain uppercase, lowercase, digit, and one of @$!%*?&
const passwordRules = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  .withMessage('Password must include uppercase, lowercase, number, and special character (@$!%*?&)');

router.post('/register',
  authLimiter,
  [body('name').trim().notEmpty().isLength({ max: 50 }), body('email').isEmail().normalizeEmail(), passwordRules],
  validate,
  register
);

router.post('/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  login
);

router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/verify-email',
  [query('token').notEmpty()],
  validate,
  verifyEmail
);

router.post('/resend-verification',
  authLimiter,
  [body('email').isEmail().normalizeEmail()],
  validate,
  resendVerification
);

router.post('/forgot-password',
  resetLimiter,
  [body('email').isEmail().normalizeEmail()],
  validate,
  forgotPassword
);

router.post('/reset-password',
  authLimiter,
  [body('token').notEmpty(), passwordRules],
  validate,
  resetPassword
);

router.get('/me', authenticate, getMe);

module.exports = router;
