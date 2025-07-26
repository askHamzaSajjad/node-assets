const { v4: uuidv4 } = require("uuid");
const User = require("../models/userModel");
const Invitation = require("../models/invitationModel");
const { sendInvitationEmail } = require("../services/emailService");
const Profiler = require("../models/profileModel");



exports.sendInvitation = async (req, res) => {
  try {
    const { email } = req.body;
    const invitedBy = req.user._id;
    const token = uuidv4();
    const referralUrl = `${token}`;

    const invitation = await Invitation.create({
      token,
      invitedBy,
      email: email || undefined,
    });

    const userProfile = await Profiler.findOne({ user: invitedBy });
    const name = userProfile.firstName +' '+ userProfile.lastName;



    if (email) {
      await sendInvitationEmail(email, referralUrl, name);
      return res.status(200).json({
        message: "Invitation sent to email.",
      });
    }

    return res.status(200).json({
      message: "Referral link generated.",
      token,
      referralUrl,
    });
  } catch (error) {
    console.error("Invitation error:", error);
    res.status(500).json({ message: "Failed to create invitation." });
  }
};


exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.query;

    const invite = await Invitation.findOne({ token });

    if (!invite) return res.status(404).json({ message: "Invalid or expired link." });

    if (invite.accepted) return res.status(400).json({ message: "Invitation already used." });

    invite.accepted = true;
    invite.acceptedAt = new Date();
    await invite.save();

    res.status(200).json({
      message: "Invitation accepted. You may proceed to sign up.",
      invitedEmail: invite.invitedEmail,
    });
  } catch (err) {
    console.error("Accept Invitation Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getMyInvitations = async (req, res) => {
  try {
    const invites = await Invitation.find({ invitedBy: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({ invitations: invites });
  } catch (err) {
    console.error("Get Invitations Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
