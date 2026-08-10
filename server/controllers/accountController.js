const bcrypt = require('bcrypt');
const User = require('../models/User');
const Quote = require('../models/QuoteRequest');
const ServiceInquiry = require('../models/ServiceInquiry');

exports.updateAccount = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || typeof user.save !== 'function') {
      return res.status(400).json({ error: 'Account update not supported for this account' });
    }

    const { email, password } = req.body;
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: 'Email is already in use' });
      }
      user.email = email;
    }

    if (password) {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(password)) {
        return res.status(400).json({ error: 'New password must contain uppercase, lowercase, number, and special character.' });
      }
      user.passwordHash = await bcrypt.hash(password, 12);
    }

    await user.save();

    res.json({ success: true, user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
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

exports.deleteAccount = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || typeof user.deleteOne !== 'function') {
      return res.status(400).json({ error: 'Account deletion not supported for this account' });
    }

    // Remove associated data
    try {
      await Quote.deleteMany({ user: user._id });
    } catch (e) { /* continue even if quote cleanup fails */ }

    try {
      await ServiceInquiry.deleteMany({ email: user.email });
    } catch (e) { /* continue even if inquiry cleanup fails */ }

    await user.deleteOne();

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};
