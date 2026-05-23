const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, generateSecureToken, hashToken } = require('../utils/tokens');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

// HTTP-only + SameSite=Strict: cookie is inaccessible to JS (XSS protection) and
// not sent on cross-site requests (CSRF protection)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const rawToken = generateSecureToken();
    await User.create({
      name,
      email,
      password,
      emailVerificationToken: hashToken(rawToken),
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    await sendVerificationEmail(email, name, rawToken);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (user.isLocked) {
      return res.status(423).json({ message: 'Account temporarily locked. Please try again later.' });
    }

    if (!(await user.comparePassword(password))) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before signing in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    if (user.loginAttempts > 0) {
      await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Cap stored sessions at 5 concurrent devices (oldest dropped)
    const tokens = [...user.refreshTokens, hashToken(refreshToken)].slice(-5);
    await user.updateOne({ $set: { refreshTokens: tokens } });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({
      accessToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const hashed = hashToken(token);
    const user = await User.findOne({ _id: payload.id, refreshTokens: hashed });

    if (!user) {
      // Token not in DB means it was already rotated — possible reuse attack
      await User.findByIdAndUpdate(payload.id, { $set: { refreshTokens: [] } });
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({ message: 'Session invalidated. Please sign in again.' });
    }

    const newAccess = generateAccessToken(user._id);
    const newRefresh = generateRefreshToken(user._id);
    const updatedTokens = user.refreshTokens
      .filter((t) => t !== hashed)
      .concat(hashToken(newRefresh))
      .slice(-5);

    await user.updateOne({ $set: { refreshTokens: updatedTokens } });
    res.cookie('refreshToken', newRefresh, COOKIE_OPTIONS);
    res.json({
      accessToken: newAccess,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout does not require a valid access token — the refresh token cookie is enough
const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      let userId;
      try {
        ({ id: userId } = jwt.verify(token, process.env.JWT_REFRESH_SECRET));
      } catch {
        res.clearCookie('refreshToken', { path: '/' });
        return res.json({ message: 'Logged out' });
      }
      await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: hashToken(token) } });
    }
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: hashToken(req.query.token),
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    await user.updateOne({
      $set: { isVerified: true },
      $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
    });

    res.json({ message: 'Email verified successfully. You can now sign in.' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    // Always return the same message to prevent account enumeration
    const genericMsg = 'If an unverified account with that email exists, a new link has been sent.';
    if (!user || user.isVerified) return res.json({ message: genericMsg });

    const rawToken = generateSecureToken();
    await user.updateOne({
      emailVerificationToken: hashToken(rawToken),
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });
    await sendVerificationEmail(user.email, user.name, rawToken);

    res.json({ message: genericMsg });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const genericMsg = 'If an account with that email exists, a reset link has been sent.';
    if (!user) return res.json({ message: genericMsg });

    const rawToken = generateSecureToken();
    await user.updateOne({
      passwordResetToken: hashToken(rawToken),
      passwordResetExpires: Date.now() + 60 * 60 * 1000,
    });
    await sendPasswordResetEmail(user.email, user.name, rawToken);

    res.json({ message: genericMsg });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      passwordResetToken: hashToken(req.body.token),
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // invalidate all sessions on password change
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Password reset successful. Please sign in with your new password.' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register, login, refresh, logout,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
  getMe,
};
