require('dotenv').config();
const mongoose = require('mongoose');
const ServiceInquiry = require('../models/ServiceInquiry');

(async () => {
  const data = {
    fullName: 'Quote Test',
    email: 'smoke.quote.test@example.com',
    phone: '1234567890',
    company: 'SmokeCo',
    serviceType: 'Website Development',
    formData: {
      websiteType: 'Business Website',
      budget: 'Rs. 15,000 - Rs. 35,000',
      timeline: '4-6 weeks',
      description: 'Test quote request'
    }
  };

  try {
    const res = await fetch('http://localhost:3000/submit-service-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const body = await res.text();
    console.log('status', res.status);
    console.log('body', body);

    if (res.ok) {
      const uri = process.env.MONGO_URI;
      if (uri) {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const inquiry = await ServiceInquiry.findOne({ email: data.email }).sort({ createdAt: -1 }).lean();
        console.log('db record', inquiry ? JSON.stringify(inquiry, null, 2) : 'not found');
      } else {
        console.warn('MONGO_URI not set; DB verification skipped');
      }
    }
  } catch (err) {
    console.error('request error', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  }
})();
