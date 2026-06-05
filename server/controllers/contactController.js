const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendMail } = require('../utils/email');

exports.submitContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, phone, message } = req.body;
    const contact = await Contact.create({ name, email, phone, message });

    // send notification email
    try {
      await sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
        subject: `New contact from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`
      });
    } catch (mailErr) {
      console.warn('Failed to send contact email:', mailErr.message);
    }

    res.json({ success: true, contactId: contact._id });
  } catch (err) {
    next(err);
  }
};
