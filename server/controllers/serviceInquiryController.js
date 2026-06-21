const { validationResult } = require('express-validator');
const ServiceInquiry = require('../models/ServiceInquiry');
const { sendMail } = require('../utils/email');

exports.submitInquiry = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { fullName, email, phone, company, serviceType, formData } = req.body;

    console.info('Service inquiry submission:', {
      route: req.originalUrl,
      fullName,
      email,
      phone,
      company,
      serviceType
    });

    const inquiry = await ServiceInquiry.create({ fullName, email, phone, company, serviceType, formData });

    try {
      await sendMail({
        from: process.env.EMAIL_USER,
        to: 'elevixor1042@gmail.com',
        replyTo: email,
        subject: `New ${serviceType} quote request from ${fullName}`,
        html: `<h3>New Quote Request</h3>
               <p><strong>Name:</strong> ${fullName}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
               <p><strong>Service Type:</strong> ${serviceType}</p>
               <h4>Details</h4>
               <pre>${JSON.stringify(formData || {}, null, 2)}</pre>`,
        text: `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nService Type: ${serviceType}\n\nDetails:\n${JSON.stringify(formData || {}, null, 2)}`
      });
    } catch (mailErr) {
      console.warn('Failed to send service inquiry email:', mailErr.message);
    }

    res.json({ success: true, inquiryId: inquiry._id });
  } catch (err) {
    next(err);
  }
};
