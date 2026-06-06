const mongoose = require('mongoose');

const ServiceInquirySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String },
  company: { type: String },
  serviceType: { type: String, required: true },
  formData: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceInquiry', ServiceInquirySchema);
