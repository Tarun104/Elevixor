const nodemailer = require('nodemailer');

async function sendMail(opts) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) throw new Error('Email credentials not configured');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000
  });

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  return transporter.sendMail(Object.assign({}, opts, { from }));
}

module.exports = { sendMail };
