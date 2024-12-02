const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createMessage(toNumber, message) {
  const message = await client.messages.create({
    body: message,
    from: process.env.TWILIO_NUMBER,
    to: toNumber,
  });

  console.log(message.body);
}