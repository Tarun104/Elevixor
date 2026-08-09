const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, trim: true, default: '' },
  lastName: { type: String, trim: true, default: '' },
  name: { type: String, trim: true, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  avatarUrl: { type: String, default: '' },
  age: { type: String, default: '' },
  gender: { type: String, default: '' },
  contact: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  role: { type: String, default: 'user' }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
