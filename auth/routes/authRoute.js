const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');

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
 *       description: Signup details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: strongPassword123
 *               role:
 *                 type: string
 *                 example: mother
 *     responses:
 *       201:
 *         description: Signup successful, OTP sent to email
 *       400:
 *         description: Email and password required
 *       409:
 *         description: User already exists
 */
router.post('/signup', authController.signup);

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
 *         description: Signup verified successfully, returns access and refresh tokens and user data
 *       400:
 *         description: Invalid or expired OTP or already verified
 */
router.post('/verify-otp-signup', authController.verifyOtpForSignup);

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
 *         description: Invalid request (e.g., user already verified)
 */
router.post('/resend-signup-otp', authController.resendSignupOtp);

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
 *         description: Login successful, returns access and refresh tokens and user data
 *       401:
 *         description: Incorrect password
 *       403:
 *         description: Invalid or unverified user
 */
router.post('/signin', authController.signin);

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
 *         description: OTP sent for password reset or user not found (to avoid user enumeration)
 */
router.post('/forgot-password', authController.forgotPassword);

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
 *         description: OTP verified, user may reset password
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-otp-forgot-password', authController.verifyOtpForForgotPassword);

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
 *         description: Reset not allowed (OTP not verified)
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       description: Refresh token data
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
 *         description: New access and refresh tokens issued
 *       403:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', authController.refreshToken);

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
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/social-login:
 *   post:
 *     summary: Social login or register user via OAuth provider (Google or Apple)
 *     tags: [Auth]
 *     requestBody:
 *       description: Social login details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [provider, token]
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, apple]
 *                 example: google
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               role:
 *                 type: string
 *                 example: mother
 *     responses:
 *       200:
 *         description: Login successful, returns tokens and user data
 *       400:
 *         description: Unsupported provider
 *       500:
 *         description: Social login failed
 */
router.post('/social-login', authController.socialLogin);

/**
 * @swagger
 * /auth/delete-account:
 *   post:
 *     summary: Request OTP to confirm account deletion (requires authentication)
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
router.post('/delete-account', authenticate, authController.requestDeleteAccountOtp);

/**
 * @swagger
 * /auth/verify-delete-account:
 *   post:
 *     summary: Verify OTP and delete user account (requires authentication)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: OTP verification for account deletion
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
 *         description: Account deleted successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-delete-account', authenticate, authController.verifyDeleteAccountOtp);

module.exports = router;
