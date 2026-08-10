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
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
}

async function sendMail(opts) {
  const transporter = createTransport();
  if (!transporter) throw new Error('Email credentials not configured');
  // Send from the brand address when EMAIL_FROM is set; otherwise fall back to the SMTP login.
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  return transporter.sendMail(Object.assign({}, opts, { from }));
}

module.exports = { sendMail };
