const User = require('../models/User');
const Quote = require('../models/QuoteRequest');

const path = require('path');

exports.profile = async (req, res, next) => {
  try {
    const user = req.user;
    const safeUser = {
      id: user._id || user.email,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      avatarUrl: user.avatarUrl || '',
      age: user.age || '',
      gender: user.gender || '',
      contact: user.contact || '',
      whatsapp: user.whatsapp || ''
    };
    res.json({ success: true, user: safeUser });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, age, gender, contact, whatsapp } = req.body;
    const user = req.user;
    if (!user || typeof user.save !== 'function') {
      return res.status(400).json({ error: 'Profile update not supported for this account' });
    }
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.name = `${user.firstName} ${user.lastName}`.trim();
    user.age = age || user.age;
    user.gender = gender || user.gender;
    user.contact = contact || user.contact;
    user.whatsapp = whatsapp || user.whatsapp;
    await user.save();
    res.json({ success: true, user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      avatarUrl: user.avatarUrl || '',
      age: user.age || '',
      gender: user.gender || '',
      contact: user.contact || '',
      whatsapp: user.whatsapp || ''
    }});
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

    const user = req.user;
    if (!user || typeof user.save !== 'function') {
      return res.status(400).json({ error: 'Avatar upload not supported for this account' });
    }

    const publicPath = path.join('/uploads', req.file.filename).replace(/\\/g, '/');
    user.avatarUrl = publicPath;
    await user.save();
    res.json({ success: true, user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: user.name || '',
      avatarUrl: user.avatarUrl,
      age: user.age || '',
      gender: user.gender || '',
      contact: user.contact || '',
      whatsapp: user.whatsapp || ''
    }});
  } catch (err) {
    next(err);
  }
};
