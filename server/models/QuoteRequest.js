const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
  clientName: String,
  email: String,
  phone: String,
  company: String,
  projectType: String,
  budget: String,
  timeline: String,
  requirements: String,
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('QuoteRequest', QuoteSchema);
