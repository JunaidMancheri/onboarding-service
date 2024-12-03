const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

exports.sendSMS = async function(toNumber, message) {
  const message = await client.messages.create({
    body: message,
    from: process.env.TWILIO_NUMBER,
    to: toNumber,
  });
}

