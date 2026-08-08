const mongoose = require('mongoose');

const ResetCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
});

ResetCodeSchema.index({ email: 1, code: 1 });
ResetCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ResetCode', ResetCodeSchema);
