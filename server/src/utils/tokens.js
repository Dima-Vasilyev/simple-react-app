const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// crypto.randomBytes produces a cryptographically secure random token
const generateSecureToken = () => crypto.randomBytes(32).toString('hex');

// We store only the SHA-256 hash of tokens in the DB.
// If the DB is breached, raw tokens cannot be used — same principle as hashed passwords.
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

module.exports = { generateAccessToken, generateRefreshToken, generateSecureToken, hashToken };
