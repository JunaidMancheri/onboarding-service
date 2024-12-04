const nodemailer = require('nodemailer');
const { generateOTP } = require('./utils/generateOtp');
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_ID,
    pass: process.env.MAIL_APP_PASSWORD,
  },
});

function sendMail(toMailId, mailData) {
  const mailOptions = {
    from: process.env.MAIL_ID,
    to: toMailId,
    subject: mailData.subject,
    text: mailData.text,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(`Error while sending email: ${error.message}`);
        return reject(error.message);
      }
      return resolve();
    });
  });
}

exports.sendOtpMail = async function (toMailId) {
  const otp = generateOTP();
  const mailData = {
    subject: 'Email Verification',
    text: `${otp} is your OTP. Kindly update the bot with your received otp`,
  };

  await sendMail(toMailId, mailData);
  return otp;
};
