const User = require('../models/User');
const Quote = require('../models/QuoteRequest');

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
