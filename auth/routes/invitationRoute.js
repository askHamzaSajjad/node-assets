const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware");
const invitationController = require("../controllers/invitationController");

/**
 * @swagger
 * tags:
 *   name: Invitations
 *   description: Referral invitation management
 */

/**
 * @swagger
 * /invitation/send:
 *   post:
 *     summary: Generate or email a referral invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Email to send invitation to (optional)
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: invitee@example.com
 *     responses:
 *       200:
 *         description: Invitation sent or link returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation sent to email.
 *                 referralToken:
 *                   type: string
 *                   example: 6e30b9f5-b4ea-4e47-9fc9-abcdef123456
 *                 referralUrl:
 *                   type: string
 *                   example: https://circleoverwatch.app/auth/signup?referralToken=abc123
 *       500:
 *         description: Internal server error
 */
router.post("/send", authenticate, invitationController.sendInvitation);

/**
 * @swagger
 * /invitation/accept:
 *   get:
 *     summary: Accept an invitation using a referral token
 *     tags: [Invitations]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Referral token received via email
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *       400:
 *         description: Invitation already used
 *       404:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.get("/accept", invitationController.acceptInvitation);

/**
 * @swagger
 * /invitation/mine:
 *   get:
 *     summary: Get all invitations sent by the authenticated user
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invitations sent by user
 *       500:
 *         description: Server error
 */
router.get("/mine", authenticate, invitationController.getMyInvitations);

module.exports = router;
