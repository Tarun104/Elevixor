const nodemailer = require('nodemailer');

async function sendMail(opts) {
  const attachments = Array.isArray(opts.attachments) ? opts.attachments : [];

  // Brevo HTTP API (works on Render — SMTP is blocked)
  const apiKey = process.env.BREVO_API_KEY;
  if (apiKey) {
    const from = process.env.EMAIL_FROM || 'elevixor1042@gmail.com';
    const to = opts.to || process.env.EMAIL_RECIPIENT || 'elevixor1042@gmail.com';
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { email: from, name: 'Elevixor' },
        to: [{ email: to }],
        subject: opts.subject || 'No subject',
        htmlContent: opts.html || opts.text || '',
        textContent: opts.text || '',
        ...(attachments.length > 0 ? {
          attachment: attachments.map(({ filename, content, ...attachment }) => ({
            name: filename || attachment.name,
            content: Buffer.isBuffer(content) ? content.toString('base64') : content
          }))
        } : {})
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Brevo API error ' + res.status);
    }
    return { success: true };
  }

  // SMTP fallback (for local development)
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

module.exports = { sendMail };
