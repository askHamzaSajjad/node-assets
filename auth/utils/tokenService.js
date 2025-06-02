const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshTokenModel');

exports.generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });
};


exports.generateRefreshToken = async (user) => {
  // 1. Revoke existing tokens
  await RefreshToken.updateMany(
    { userId: user._id, isRevoked: false },
    { $set: { isRevoked: true } }
  );

  // 2. Create new refresh token
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  // 3. Store new token
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return refreshToken;
};
