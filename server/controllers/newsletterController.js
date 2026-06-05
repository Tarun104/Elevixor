const Subscriber = require('../models/Subscriber');

exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const existing = await Subscriber.findOne({ email });
    if (existing) return res.json({ success: true, message: 'Already subscribed' });
    await Subscriber.create({ email });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
