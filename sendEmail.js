const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_ID,
    pass: process.env.MAIL_APP_PASSWORD,
  },
});

exports.sendMail = function (toMailId, mailData) {
  const mailOptions = {
    from: process.env.MAIL_ID,
    to: toMailId,
    subject: mailData.subject,
    text: mailData.text,
    html: mailData.html,
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
};
