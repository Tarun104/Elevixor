const { validationResult } = require('express-validator');
const Quote = require('../models/QuoteRequest');
const { sendMail } = require('../utils/email');

exports.submitQuote = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { clientName, email, phone, company, projectType, budget, timeline, requirements } = req.body;
    const quote = await Quote.create({ clientName, email, phone, company, projectType, budget, timeline, requirements, user: req.user && req.user._id });

    // send formatted email
    try {
      await sendMail({
        from: process.env.EMAIL_USER,
        to: 'elevixor1042@gmail.com',
        replyTo: email,
        subject: `Quote request: ${projectType || 'Project'} from ${clientName}`,
        html: `<h3>Quote Request</h3>
               <p><strong>Client:</strong> ${clientName}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Phone:</strong> ${phone}</p>
               <p><strong>Project Type:</strong> ${projectType || 'N/A'}</p>
               <p><strong>Budget:</strong> ${budget || 'N/A'}</p>
               <p><strong>Timeline:</strong> ${timeline || 'N/A'}</p>
               <h4>Requirements</h4>
               <pre>${requirements || ''}</pre>`
      });
    } catch (mailErr) {
      console.warn('Failed to send quote email:', mailErr.message);
    }

    res.json({ success: true, quoteId: quote._id });
  } catch (err) {
    next(err);
  }
};
