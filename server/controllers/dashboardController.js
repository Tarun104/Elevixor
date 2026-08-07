const User = require('../models/User');
const Quote = require('../models/QuoteRequest');

const path = require('path');

exports.profile = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.quotes = async (req, res, next) => {
  try {
    const list = await Quote.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ quotes: list });
  } catch (err) {
    next(err);
  }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Ensure user is a Mongoose document (not file-backed user)
    const user = req.user;
    if (!user || typeof user.save !== 'function') {
      return res.status(400).json({ error: 'Avatar upload not supported for this account' });
    }

    // store a public path relative to repo root so express.static serves it
    const publicPath = path.join('/uploads', req.file.filename).replace(/\\/g, '/');
    user.avatarUrl = publicPath;
    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
