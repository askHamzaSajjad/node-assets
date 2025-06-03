const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Basic Details
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  profilePicture: { type: String },

  // Physical Stats
  weight: {
    value: { type: Number },
    unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
  },
  height: {
    value: { type: Number },
    unit: { type: String, enum: ['cm', 'ft'], default: 'cm' }
  },

  // Trainer Specific: Expertise & Certificate
  expertise: {
    type: [String],
    default: null
  },
  otherExpertise: {
    type: String,
    default: null
  },
  certificate: {
    type: [String], // URL to uploaded file
    default: []
  },

  // Taxation Forms
  taxationForms: {
    type: [String], // Array of uploaded file URLs
    default: []
  },

  // Chat Permission
  allowChats: {
    type: Boolean,
    default: true
  },

  // Bank Account Details
  bankDetails: {
    bankName: { type: String, default: null },
    accountNumber: { type: String, default: null },
    accountTitle: { type: String, default: null },
    accountType: { type: String, enum: ['Savings', 'Current', 'Other'], default: null },
    isSaved: { type: Boolean, default: false }
  }

}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
