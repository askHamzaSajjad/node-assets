const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const appleSigninAuth = require("apple-signin-auth");

const User = require("../models/userModel");
const RefreshToken = require("../models/refreshTokenModel");

const { generateOtp } = require("../utils/generateOtp");
const { sendOtpEmail } = require("../services/emailService");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/tokenService");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// Register new user and send verification OTP
exports.signup = async (req, res) => {
  try {
    const { email, password, role = "mother" } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 12);
    const { otp, expiry } = generateOtp();

    const user = await User.create({
      email,
      role,
      password: hashedPassword,
      otp,
      otpExpiry: expiry,
    });

    await sendOtpEmail(email, otp, "signup");
    res.status(201).json({ message: "Signup successful, OTP sent to email." });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup." });
  }
};

// Verify signup OTP and activate user account
exports.verifyOtpForSignup = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.isVerified) return res.status(400).json({ message: "Invalid or already verified." });

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.status(200).json({
      message: "Signup verified successfully.",
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider
      }
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};

// Resend OTP for signup verification
exports.resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.isVerified)
      return res.status(400).json({ message: "Invalid request." });

    const { otp, expiry } = generateOtp();
    user.otp = otp;
    user.otpExpiry = expiry;
    await user.save();

    await sendOtpEmail(email, otp, "signup");
    res.status(200).json({ message: "OTP resent to email." });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error while resending OTP." });
  }
};

// Authenticate user and issue tokens
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isVerified)
      return res.status(403).json({ message: "Invalid or unverified user." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password." });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Server error during signin." });
  }
};

// Generate OTP for password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: "User not found." });

    const { otp, expiry } = generateOtp();
    user.otp = otp;
    user.otpExpiry = expiry;
    await user.save();

    await sendOtpEmail(email, otp, "forgotPassword");
    res.status(200).json({ message: "OTP sent for password reset." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Verify OTP for password reset
exports.verifyOtpForForgotPassword = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.canResetPassword = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "OTP verified. You may reset password." });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Update user password after OTP verification
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.canResetPassword) {
      return res.status(403).json({ message: "Reset not allowed." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.canResetPassword = false;
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Refresh access token using valid refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  const storedToken = await RefreshToken.findOne({ token: refreshToken });

  if (
    !storedToken ||
    storedToken.isRevoked ||
    storedToken.expiresAt < new Date()
  ) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token." });
  }

  const user = await User.findById(storedToken.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  storedToken.isRevoked = true;
  await storedToken.save();

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user);

  res
    .status(200)
    .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
};

// Logout user by revoking refresh token
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  const token = await RefreshToken.findOne({ token: refreshToken });
  if (token) {
    token.isRevoked = true;
    await token.save();
  }
  res.status(200).json({ message: "Logged out successfully." });
};

// Send OTP to confirm account deletion
exports.requestDeleteAccountOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.isVerified)
    return res.status(404).json({ message: "User not found." });

  const { otp, expiry } = generateOtp();
  user.otp = otp;
  user.otpExpiry = expiry;
  await user.save();

  await sendOtpEmail(email, otp, "accountDeletion");
  res.status(200).json({ message: "OTP sent for account deletion." });
};

// Verify OTP and delete user account
exports.verifyDeleteAccountOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }

  await RefreshToken.deleteMany({ userId: user._id });
  await User.findByIdAndDelete(user._id);

  res.status(200).json({ message: "Account deleted successfully." });
};

// Social login or register user via OAuth provider
exports.socialLogin = async (req, res) => {
  const { provider, token, role = "mother" } = req.body;
  let userInfo;

  try {
    if (provider === "google") {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      userInfo = {
        email: payload.email,
        name: payload.name,
        providerId: payload.sub,
      };
    } else if (provider === "apple") {
      const payload = await appleSigninAuth.verifyIdToken(token, {
        audience: process.env.APPLE_CLIENT_ID,
      });
      userInfo = {
        email: payload.email,
        name: payload.name || "Apple User",
        providerId: payload.sub,
      };
    } else {
      return res.status(400).json({ message: "Unsupported provider." });
    }

    let user = await User.findOne({ email: userInfo.email });

    if (!user) {
      user = await User.create({
        email: userInfo.email,
        name: userInfo.name,
        provider,
        isVerified: true,
        role,
        [`${provider}Id`]: userInfo.providerId,
      });
    } else {
      if (!user[`${provider}Id`]) {
        user[`${provider}Id`] = userInfo.providerId;
        user.provider = provider;
      }
      if (!user.role) {
        user.role = role;
      }
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error("Social login error:", error);
    res.status(500).json({ message: "Social login failed." });
  }
};

// Set password after OTP verification (for signup flow)
exports.createPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isVerified || user.password) {
      return res
        .status(403)
        .json({ message: "Invalid request. Either user not found, not verified, or password already set." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.status(200).json({
      message: "Password set successfully.",
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error("Create password error:", error);
    res.status(500).json({ message: "Server error while setting password." });
  }
};
