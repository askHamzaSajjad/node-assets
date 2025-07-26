const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedEmail: {
      type: String,
    //   required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    accepted: {
      type: Boolean,
      default: false,
    },
    acceptedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", invitationSchema);
