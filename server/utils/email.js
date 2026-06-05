const nodemailer = require('nodemailer');

function createTransport() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

async function sendMail(opts) {
  const transporter = createTransport();
  if (!transporter) throw new Error('Email credentials not configured');
  return transporter.sendMail(opts);
}

module.exports = { sendMail };
