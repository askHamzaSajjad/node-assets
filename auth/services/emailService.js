const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or Mailgun, SendGrid, etc.
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendOtpEmail = async (email, otp, type = 'signup') => {
  const subjectMap = {
    signup: 'Verify Your Email – FitBizZ',
    forgotPassword: 'Reset Your Password – FitBizZ',
    accountDeletion: 'Account Deletion Request – FitBizZ',
  };

  const messageMap = {
    signup: `Your OTP for FitBizZ signup is: ${otp}`,
    forgotPassword: `Your OTP to reset your FitBizZ password is: ${otp}`,
    accountDeletion: `Your OTP to confirm account deletion is: ${otp}`,
  };

  await transporter.sendMail({
    from: `"FitBizZ" <${process.env.MAIL_USER}>`,
    to: email,
    subject: subjectMap[type],
    html: `<p>${messageMap[type]}</p><p>OTP is valid for 10 minutes.</p>`,
  });
};
