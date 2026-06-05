require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 3000;
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const otpStore = new Map();

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanExpiredOtps() {
    const now = Date.now();
    for (const [email, record] of otpStore.entries()) {
        if (record.expires <= now) {
            otpStore.delete(email);
        }
    }
}

setInterval(cleanExpiredOtps, 60 * 1000);

function createGmailTransport(user, pass, port, secure) {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
    });
}

async function sendMailWithGmailFallback(user, pass, mailOptions) {
    let lastError;
    const attempts = [ { port: 465, secure: true }, { port: 587, secure: false } ];
    for (const attempt of attempts) {
        try {
            const transporter = createGmailTransport(user, pass, attempt.port, attempt.secure);
            await transporter.verify();
            await transporter.sendMail(mailOptions);
            console.log(`OTP transport succeeded on port ${attempt.port}`);
            return;
        } catch (err) {
            lastError = err;
            console.warn(`Gmail transport failed on port ${attempt.port}:`, err.message);
        }
    }
    throw lastError;
}

app.post('/send-otp', async (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        if (!email || !/^([a-zA-Z0-9._%+-]+)@gmail\.com$/i.test(email)) {
            return res.status(400).json({ error: 'A valid Gmail address is required.' });
        }

        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        if (!user || !pass) return res.status(500).json({ error: 'Email credentials are not configured on the server.' });

        const otp = generateOtp();
        const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
        otpStore.set(email, { code: otp, expires });

        const mailOptions = {
            from: user,
            to: email,
            subject: 'Your Elevixor verification code',
            text: `Hello,

Thank you for choosing Elevixor. Your 6-digit login verification code is:

${otp}

Please enter this code on the sign-in screen to access your account. This code is valid for 10 minutes.

If you did not request this code, you can safely ignore this email.

Best regards,
Elevixor Support Team`,
            html: `<p>Hello,</p>
<p>Thank you for choosing <strong>Elevixor</strong>. Your 6-digit login verification code is:</p>
<p style="font-size: 1.4rem; font-weight: 700; letter-spacing: 0.2em;">${otp}</p>
<p>Please enter this code on the sign-in screen to access your account. This code is valid for 10 minutes.</p>
<p>If you did not request this code, you can safely ignore this email.</p>
<p>Best regards,<br>Elevixor Support Team</p>`
        };

        await sendMailWithGmailFallback(user, pass, mailOptions);
        console.log(`OTP email sent to ${email}`);
        return res.json({ success: true });
    } catch (err) {
        console.error('OTP send error:', err);
        const message = err.code === 'EAUTH'
            ? 'Gmail authentication failed. Use a valid Gmail app password or verify the email credentials.'
            : err.message || 'Unable to send verification code. Please verify email credentials and that the server is running.';
        return res.status(500).json({ error: message });
    }
});

app.post('/verify-otp', (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        const otp = (req.body.otp || '').trim();
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required.' });
        }

        const record = otpStore.get(email);
        if (!record || record.expires < Date.now()) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'The code has expired. Please request a new one.' });
        }
        if (record.code !== otp) {
            return res.status(400).json({ error: 'The code you entered is not valid.' });
        }

        otpStore.delete(email);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Unable to verify code. Please try again later.' });
    }
});

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { name, phone } = req.body;
        const file = req.file;
        if (!file) return res.status(400).send('No file uploaded');

        // destination is fixed server-side
        const to = EMAIL_RECIPIENT;

        // create transporter using SMTP credentials from env
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        if (!user || !pass) return res.status(500).send('Email credentials not configured on server');

        const mailOptions = {
            from: user,
            to: to,
            replyTo: req.body.userEmail || user,
            subject: `New file from ${name} (${phone})`,
            text: `A file was submitted from the website by ${name} (${req.body.userEmail || 'no-email-provided'}) (phone: ${phone}). See attachment.`,
            attachments: [
                {
                    filename: file.originalname || file.filename,
                    path: path.join(__dirname, file.path)
                }
            ]
        };

        await sendMailWithGmailFallback(user, pass, mailOptions);

        // remove uploaded file
        fs.unlink(path.join(__dirname, file.path), () => { });

        res.status(200).send('OK');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error: ' + (err.message || err));
    }
});

// User authentication system
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch (err) {
        console.error('Error loading users:', err);
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function findUserByEmail(email) {
    const users = loadUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// Hash password (simple - in production use bcrypt)
function hashPassword(password) {
    return Buffer.from(password).toString('base64');
}

function verifyPassword(password, hash) {
    return Buffer.from(password).toString('base64') === hash;
}

// Register endpoint
app.post('/register', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !/^[^\s@]+@gmail\.com$/i.test(email)) {
            return res.status(400).json({ error: 'Valid Gmail address required.' });
        }

        if (!password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(password)) {
            return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character.' });
        }

        if (findUserByEmail(email)) {
            return res.status(400).json({ error: 'You already have an account with this email.' });
        }

        const users = loadUsers();
        users.push({
            email: email.toLowerCase(),
            password: hashPassword(password),
            createdAt: new Date().toISOString()
        });
        saveUsers(users);

        res.json({ success: true, message: 'Registration successful! You can now sign in.' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

// Login endpoint
app.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required.' });
        }

        const user = findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Email not registered.' });
        }

        if (!verifyPassword(password, user.password)) {
            return res.status(401).json({ error: 'Incorrect password.' });
        }

        res.json({ success: true, message: 'Login successful!', email: user.email });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// Forgot password endpoint (send OTP)
app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !/^[^\s@]+@gmail\.com$/i.test(email)) {
            return res.status(400).json({ error: 'Valid Gmail address required.' });
        }

        const user = findUserByEmail(email);
        if (!user) {
            // Don't reveal if email exists for security
            return res.json({ success: true, message: 'If email exists, OTP will be sent.' });
        }

        const otp = generateOtp();
        const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
        otpStore.set(`reset_${email}`, { code: otp, expires });

        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        const mailOptions = {
            from: emailUser,
            to: email,
            subject: 'Elevixor - Reset your password',
            text: `Hello,

You requested to reset your password. Your 6-digit reset code is:

${otp}

This code is valid for 15 minutes. If you didn't request this, ignore this email.

Best regards,
Elevixor Support Team`,
            html: `<p>Hello,</p>
<p>You requested to reset your password. Your 6-digit reset code is:</p>
<p style="font-size: 1.4rem; font-weight: 700; letter-spacing: 0.2em;">${otp}</p>
<p>This code is valid for 15 minutes. If you didn't request this, ignore this email.</p>
<p>Best regards,<br>Elevixor Support Team</p>`
        };

        await sendMailWithGmailFallback(emailUser, emailPass, mailOptions);
        res.json({ success: true, message: 'OTP sent to email.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Unable to send reset code.' });
    }
});

// Reset password endpoint
app.post('/reset-password', (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'Email, OTP, and new password required.' });
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(newPassword)) {
            return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character.' });
        }

        const record = otpStore.get(`reset_${email}`);
        if (!record || record.expires < Date.now()) {
            otpStore.delete(`reset_${email}`);
            return res.status(400).json({ error: 'Reset code has expired.' });
        }

        if (record.code !== otp) {
            return res.status(400).json({ error: 'Invalid reset code.' });
        }

        const users = loadUsers();
        const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found.' });
        }

        users[userIndex].password = hashPassword(newPassword);
        users[userIndex].passwordResetAt = new Date().toISOString();
        saveUsers(users);

        otpStore.delete(`reset_${email}`);
        res.json({ success: true, message: 'Password reset successful!' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Password reset failed.' });
    }
});

// health endpoint for client checks
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Service Inquiry Endpoint
app.post('/submit-service-inquiry', async (req, res) => {
    try {
        const { fullName, email, phone, company, serviceType, formData } = req.body;

        if (!fullName || !email || !phone) {
            return res.status(400).json({ error: 'Full Name, Email, and Phone are required.' });
        }

        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        if (!user || !pass) {
            return res.status(500).json({ error: 'Email credentials are not configured on the server.' });
        }

        // Format form data for email body
        let formDataHtml = '<ul>';
        if (formData && typeof formData === 'object') {
            for (const [key, value] of Object.entries(formData)) {
                if (value && value.trim()) {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    formDataHtml += `<li><strong>${label}:</strong> ${value}</li>`;
                }
            }
        }
        formDataHtml += '</ul>';

        const mailOptions = {
            from: user,
            to: EMAIL_RECIPIENT,
            replyTo: email,
            subject: `New ${serviceType || 'Service'} Inquiry from ${fullName}`,
            html: `
                <h2>New Service Inquiry</h2>
                <p><strong>Service Type:</strong> ${serviceType || 'Not specified'}</p>
                <h3>Customer Information</h3>
                <ul>
                    <li><strong>Full Name:</strong> ${fullName}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Phone:</strong> ${phone}</li>
                    <li><strong>Company:</strong> ${company || 'Not specified'}</li>
                </ul>
                <h3>Inquiry Details</h3>
                ${formDataHtml}
                <hr>
                <p><em>This inquiry was submitted from the Elevixor website service inquiry form.</em></p>
            `,
            text: `
New ${serviceType || 'Service'} Inquiry from ${fullName}

Customer Information:
- Full Name: ${fullName}
- Email: ${email}
- Phone: ${phone}
- Company: ${company || 'Not specified'}

Service Type: ${serviceType || 'Not specified'}

Form Data:
${Object.entries(formData || {}).map(([k, v]) => v && v.trim() ? `${k}: ${v}` : '').filter(Boolean).join('\n')}

---
This inquiry was submitted from the Elevixor website service inquiry form.
            `
        };

        await sendMailWithGmailFallback(user, pass, mailOptions);
        console.log(`Service inquiry email sent to ${EMAIL_RECIPIENT} from ${email}`);
        return res.json({ success: true, message: 'Inquiry submitted successfully. You will receive a confirmation email shortly.' });
    } catch (err) {
        console.error('Service inquiry send error:', err);
        const message = err.code === 'EAUTH'
            ? 'Email service authentication failed. Please verify server email credentials.'
            : err.message || 'Unable to submit inquiry. Please try again later.';
        return res.status(500).json({ error: message });
    }
});

app.use(express.static('.'));

app.listen(PORT, () => console.log(`Upload server listening on http://localhost:${PORT}`));