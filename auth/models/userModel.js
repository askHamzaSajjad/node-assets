const mongoose = require('mongoose');
const RefreshToken = require('../models/refreshTokenModel');
const Profile = require('../models/profileModel');



const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String },

  // OTP Verification
  isVerified: { type: Boolean, default: false },
  canResetPassword: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },

  // Social Providers
  provider: { type: String, default: 'email', enum: ['email', 'google', 'apple'] },
  googleId: { type: String, unique: true, sparse: true },
  appleId: { type: String, unique: true, sparse: true },

  // Role Management
  role: { type: String, enum: ['mother', 'trainer', 'admin'], default: 'mother' },

  // Subscription
  subscriptionType: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },

  // Meta
  isDeleted: { type: Boolean, default: false },
  isProfileCompleted: { type: Boolean, default: false },


}, { timestamps: true });


// ⛔ Hook to clean up associated data
userSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;

  const userId = doc._id;

  try {
    await RefreshToken.deleteMany({ userId });
    await Profile.deleteOne({ user: userId });
    // await WorkoutPlan.deleteMany({ trainer: userId });
    // await Chat.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

    console.log(`🧹 Cleaned up data for deleted user: ${userId}`);
  } catch (err) {
    console.error(`❌ Error cleaning up user data:`, err);
  }
});

module.exports = mongoose.model('User', userSchema);
