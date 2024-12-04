const twilio = require("twilio");
const { generateOTP } = require("./utils/generateOtp");
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const sendSMS = async function (toNumber, otp) {
   await client.messages.create({
    body: `This is your verification code ${otp}. Kindly update it with the bot`,
    from: process.env.TWILIO_NUMBER,
    to: toNumber,
  });
}

exports.sendOtpPhone = async function (toNumber) {
  const otp = generateOTP();
  await sendSMS(toNumber, otp);
  return otp;
}