const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ResetCode = require('../models/ResetCode');
const { sendMail } = require('../utils/email');

const USERS_FILE_PATH = path.resolve(__dirname, '..', '..', 'users.json');

async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE_PATH);
  } catch (err) {
    await fs.writeFile(USERS_FILE_PATH, '[]', 'utf8');
  }
}

async function loadUsersFile() {
  await ensureUsersFile();
  const raw = await fs.readFile(USERS_FILE_PATH, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

async function findUserInFile(email) {
  const users = await loadUsersFile();
  return users.find(user => user.email && user.email.toLowerCase() === email.toLowerCase());
}

function isBcryptHash(hash) {
  return typeof hash === 'string' && /^\$2[aby]\$/.test(hash);
}

async function verifyStoredPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }
  try {
    return Buffer.from(password).toString('base64') === storedHash;
  } catch (err) {
    return false;
  }
}

async function upgradeFilePasswordHash(email, password) {
  const users = await loadUsersFile();
  const stored = users.find(user => user.email && user.email.toLowerCase() === email.toLowerCase());
  if (!stored) return;
  if (!isBcryptHash(stored.password)) {
    stored.password = await bcrypt.hash(password, 12);
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
  }
}

const buildToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidGmail(email) {
  return typeof email === 'string' && /^[^\s@]+@gmail\.com$/i.test(email);
}

const safeUserPayload = (user) => ({
  id: user._id || user.email,
  email: user.email,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  avatarUrl: user.avatarUrl || ''
});

const sendOtpEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Elevixor verification code',
    text: `Hello,\n\nYour Elevixor verification code is: ${code}\n\nThis code is valid for 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nElevixor Support Team`,
    html: `<p>Hello,</p><p>Your Elevixor verification code is: <strong>${code}</strong></p><p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p><p>Best regards,<br>Elevixor Support Team</p>`
  };
  await sendMail(mailOptions);
};

const validatePassword = (password) => {
  return typeof password === 'string' && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(password);
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { firstName = '', lastName = '', email, password } = req.body;
    const existing = await User.findOne({ email });
    const existingFile = process.env.NODE_ENV === 'production' ? null : await findUserInFile(email);
    if (existing || existingFile) return res.status(400).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const name = `${firstName || ''} ${lastName || ''}`.trim();
    const user = await User.create({ firstName, lastName, name, email, passwordHash: hash });

    const token = buildToken({ id: user._id });
    res.json({ success: true, token, user: safeUserPayload(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    let user = await User.findOne({ email }).select('+passwordHash password');
    let isFileUser = false;

    if (!user && process.env.NODE_ENV !== 'production') {
      const fileUser = await findUserInFile(email);
      if (fileUser) {
        user = fileUser;
        isFileUser = true;
      }
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const storedHash = isFileUser ? user.password : (user.passwordHash || user.password);
    const ok = await verifyStoredPassword(password, storedHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (isFileUser) {
      await upgradeFilePasswordHash(email, password);
    }

    if (!isFileUser && user.password && !user.passwordHash) {
      user.passwordHash = await bcrypt.hash(password, 12);
      user.password = undefined;
      await user.save();
    }

    const token = buildToken({ id: isFileUser ? email : user._id });
    res.json({ success: true, token, user: safeUserPayload(user) });
  } catch (err) {
    next(err);
  }
};

exports.sendOtp = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!isValidGmail(email)) {
      return res.status(400).json({ error: 'A valid Gmail address is required.' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: 'Email credentials are not configured on the server.' });
    }

    const recentSends = await ResetCode.countDocuments({
      email,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
    });
    if (recentSends >= 3) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await ResetCode.create({ email, code, expiresAt });
    await sendOtpEmail(email, code);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();
    const isPasswordReset = req.body.purpose === 'password-reset';
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const record = await ResetCode.findOne({ email, code: otp, expiresAt: { $gt: new Date() } });
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired code.' });
    }

    if (!isPasswordReset) await ResetCode.deleteMany({ email });

    if (isPasswordReset) return res.json({ success: true });

    const user = await User.findOne({ email });
    if (user) {
      const token = buildToken({ id: user._id });
      return res.json({ success: true, token, user: safeUserPayload(user) });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Email, code, and both password fields are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character.' });
    }

    const record = await ResetCode.findOne({ email, code: otp, expiresAt: { $gt: new Date() } });
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired code.' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (user) {
      if (await bcrypt.compare(newPassword, user.passwordHash)) {
        return res.status(400).json({ error: 'New password must be different from your old password.' });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 12);
      await user.save();
    } else if (process.env.NODE_ENV !== 'production') {
      const users = await loadUsersFile();
      const fileUser = users.find(item => item.email && item.email.toLowerCase() === email);
      if (!fileUser) return res.status(400).json({ error: 'Unable to reset password.' });
      if (await verifyStoredPassword(newPassword, fileUser.password)) {
        return res.status(400).json({ error: 'New password must be different from your old password.' });
      }
      fileUser.password = await bcrypt.hash(newPassword, 12);
      await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
    } else {
      return res.status(400).json({ error: 'Unable to reset password.' });
    }
    await ResetCode.deleteMany({ email });

    res.json({ success: true, message: 'Password reset successful!' });
  } catch (err) {
    next(err);
  }
};
