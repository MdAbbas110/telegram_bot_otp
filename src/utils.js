const nodemailer = require('nodemailer');
function validEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

async function sendVerificationEmail(email, code) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'mohammadabbas434@gmail.com',
      pass: 'gpzk emcb xgxa cdqo',
    },
  });

  const mailOptions = {
    from: 'mohammadabbas434@gmail.com',
    to: email,
    subject: 'Verification Code for Chat Bot',
    text: `Your verification code is: ${code}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully.');
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
}

module.exports = { validEmail, sendVerificationEmail };
