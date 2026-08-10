const nodemailer = require('nodemailer');

// Brevo HTTP API (primary — works on all platforms including Render)
async function sendViaBrevoApi(opts) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'elevixor1042@gmail.com';
  const to = opts.to || process.env.EMAIL_RECIPIENT || 'elevixor1042@gmail.com';

  const body = {
    sender: { email: from, name: 'Elevixor' },
    to: [{ email: to }],
    subject: opts.subject || 'No subject',
    htmlContent: opts.html || opts.text || '',
    textContent: opts.text || ''
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Brevo API error ${res.status}`);
  }

  return { success: true };
}

// SMTP fallback (for local development)
async function sendViaSmtp(opts) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) throw new Error('Email credentials not configured');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  return transporter.sendMail(Object.assign({}, opts, { from }));
}

// Try Brevo API first, fall back to SMTP
async function sendMail(opts) {
  if (process.env.BREVO_API_KEY) {
    return sendViaBrevoApi(opts);
  }
  return sendViaSmtp(opts);
}

module.exports = { sendMail };
