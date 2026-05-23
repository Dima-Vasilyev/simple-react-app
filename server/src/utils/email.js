const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_PORT === '465',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

const sendVerificationEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await createTransporter().sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#111827">Hello ${name},</h2>
        <p>Thanks for signing up. Click the button below to verify your email. The link expires in 24 hours.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
          Verify Email
        </a>
        <p style="color:#6b7280;font-size:13px">Or paste this URL: ${url}</p>
        <p style="color:#6b7280;font-size:13px">If you didn't create an account, you can ignore this email.</p>
      </div>`,
  });
};

const sendPasswordResetEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await createTransporter().sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#111827">Hello ${name},</h2>
        <p>You requested a password reset. This link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:13px">Or paste this URL: ${url}</p>
        <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore it.</p>
      </div>`,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
