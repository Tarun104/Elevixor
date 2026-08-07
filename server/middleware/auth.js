const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');

const USERS_FILE_PATH = path.resolve(__dirname, '..', '..', 'users.json');

module.exports = async function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');

    // First try to load from MongoDB (expecting ObjectId)
    let user = null;
    if (/^[0-9a-fA-F]{24}$/.test(String(payload.id))) {
      user = await User.findById(payload.id).select('-password');
    }

    // If not found by id, try to find by email in the DB
    if (!user) {
      try {
        user = await User.findOne({ email: payload.id }).select('-password');
      } catch (e) {
        user = null;
      }
    }

    // If still not found, fall back to file-backed users.json (dev fallback)
    if (!user) {
      try {
        const raw = await fs.readFile(USERS_FILE_PATH, 'utf8');
        const users = JSON.parse(raw || '[]');
        const fileUser = users.find(u => u.email && String(u.email).toLowerCase() === String(payload.id).toLowerCase());
        if (fileUser) {
          req.user = { email: fileUser.email, name: fileUser.name || '', _id: fileUser.email };
          return next();
        }
      } catch (e) {
        // ignore file read errors and continue to unauthorized response below
      }
    }

    req.user = user;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
