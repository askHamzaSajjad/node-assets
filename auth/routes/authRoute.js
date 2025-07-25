const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {authenticate} = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user and send verification OTP
 *     tags: [Auth]
 *     requestBody:
 *       description: Email to begin signup (optionally include referral token)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               role:
 *                 type: string
 *                 example: user
 *               referralToken:
 *                 type: string
 *                 description: Optional referral token from invitation link
 *                 example: d44f8e3e-0ed9-4f77-bb7e-abc123456789
 *     responses:
 *       201:
 *         description: OTP sent to email
 *       400:
 *         description: Invalid email
 *       409:
 *         description: User already exists
 */
router.post("/signup", authController.signup);

/**
 * @swagger
 * /auth/verify-otp-signup:
 *   post:
 *     summary: Verify signup OTP and activate user account
 *     tags: [Auth]
 *     requestBody:
 *       description: OTP verification data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Signup verified successfully
 *       400:
 *         description: Invalid or expired OTP or already verified
 */
router.post("/verify-otp-signup", authController.verifyOtpForSignup);

/**
 * @swagger
 * /auth/create-password:
 *   post:
 *     summary: Set password after successful OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       description: Email and new password after OTP verification
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: newStrongPassword123
 *     responses:
 *       200:
 *         description: Password set successfully
 *       403:
 *         description: OTP not verified or user not found
 */
router.post("/create-password", authController.createPassword);

/**
 * @swagger
 * /auth/resend-signup-otp:
 *   post:
 *     summary: Resend OTP for signup verification
 *     tags: [Auth]
 *     requestBody:
 *       description: Email to resend OTP
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Invalid request (e.g., already verified)
 */
router.post("/resend-signup-otp", authController.resendSignupOtp);

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Authenticate user and return JWT tokens
 *     tags: [Auth]
 *     requestBody:
 *       description: User credentials
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: strongPassword123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Incorrect password
 *       403:
 *         description: Invalid or unverified user
 */
router.post("/signin", authController.signin);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Generate OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       description: Email to send OTP
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent for password reset
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /auth/verify-otp-forgot-password:
 *   post:
 *     summary: Verify OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       description: OTP verification for password reset
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
  "/verify-otp-forgot-password",
  authController.verifyOtpForForgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user password after OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       description: New password data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: newStrongPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       403:
 *         description: Reset not allowed
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       description: Refresh token
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens issued
 *       403:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user by revoking refresh token
 *     tags: [Auth]
 *     requestBody:
 *       description: Refresh token to revoke
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/social-login:
 *   post:
 *     summary: Social login or register via Google or Apple
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       description: Token and provider information from frontend OAuth SDK
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - token
 *               - platform
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, apple]
 *                 example: google
 *               token:
 *                 type: string
 *                 description: ID token received from Google/Apple OAuth SDK
 *               platform:
 *                 type: string
 *                 description: Platform from which the login is initiated (e.g., android, ios, web)
 *                 example: android
 *               role:
 *                 type: string
 *                 description: Optional role if a new user is created
 *                 example: user
 *     responses:
 *       200:
 *         description: Social login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     provider:
 *                       type: string
 *                     platform:
 *                       type: string
 *       400:
 *         description: Missing or unsupported provider or token
 *       500:
 *         description: Social login failed due to server error
 */
router.post("/social-login", authController.socialLogin);


/**
 * @swagger
 * /auth/delete-account:
 *   post:
 *     summary: Request OTP to confirm account deletion
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Email for account deletion OTP
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent for account deletion
 *       404:
 *         description: User not found
 */
router.post(
  "/delete-account",
  authenticate,
  authController.requestDeleteAccountOtp
);

/**
 * @swagger
 * /auth/verify-delete-account:
 *   post:
 *     summary: Verify OTP and delete user account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: OTP for account deletion
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deleted
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
  "/verify-delete-account",
  authenticate,
  authController.verifyDeleteAccountOtp
);

module.exports = router;
