const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendMail } = require('../utils/email');

exports.submitContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const name = req.body.name || req.body.fullName || 'Unknown';
    const email = req.body.email;
    const phone = req.body.phone;
    const message = req.body.message || (req.body.formData ? JSON.stringify(req.body.formData, null, 2) : '');
    const serviceType = req.body.serviceType || 'General Inquiry';

    console.info('Contact submission:', { route: req.originalUrl, name, email, phone, serviceType });

    const contact = await Contact.create({ name, email, phone, message });

    // send notification email
    try {
      await sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
        subject: `New ${serviceType} inquiry from ${name}`,
        html: `<h3>New Inquiry</h3>
               <p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Phone:</strong> ${phone}</p>
               <p><strong>Service:</strong> ${serviceType}</p>
               <pre>${message}</pre>`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${serviceType}\n\n${message}`
      });
    } catch (mailErr) {
      console.warn('Failed to send contact email:', mailErr.message);
    }

    res.json({ success: true, contactId: contact._id });
  } catch (err) {
    next(err);
  }
};
