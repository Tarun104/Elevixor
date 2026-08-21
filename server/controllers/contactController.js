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
    const resumeFile = req.body.resumeFile;
    const resumeContent = typeof resumeFile?.data === 'string'
      ? resumeFile.data.replace(/^data:[^;]+;base64,/, '')
      : '';

    const attachments = req.file
      ? [{
          filename: req.file.originalname,
          content: req.file.buffer,
          contentType: req.file.mimetype
        }]
      : resumeFile && resumeFile.name && resumeContent
        ? [{
            filename: resumeFile.name,
            content: resumeContent,
            encoding: 'base64',
            contentType: resumeFile.type || 'application/octet-stream'
          }]
        : [];

    console.info('Contact submission:', { route: req.originalUrl, name, email, phone, serviceType });

    const contact = await Contact.create({ name, email, phone, message });

    // Respond immediately — send email in background
    res.json({ success: true, contactId: contact._id });

    // Fire-and-forget email (don't block the response)
    sendMail({
      from: process.env.EMAIL_USER,
      to: 'elevixor1042@gmail.com',
      replyTo: email,
      subject: `New ${serviceType} inquiry from ${name}`,
      html: `<h3>New Inquiry</h3>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Phone:</strong> ${phone}</p>
             <p><strong>Service:</strong> ${serviceType}</p>
             <pre>${message}</pre>`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${serviceType}\n\n${message}`,
      attachments
    }).then(() => {
      console.info('Contact email sent successfully to elevixor1042@gmail.com');
    }).catch(mailErr => {
      console.error('FAILED to send contact email:', mailErr.message);
    });
  } catch (err) {
    next(err);
  }
};
