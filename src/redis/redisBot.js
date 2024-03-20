const TelegramBot = require('node-telegram-bot-api');
const redis = require('redis');
const nodemailer = require('nodemailer');
const { validEmail } = require('../utils');

const TOKEN = '7023229435:AAH9Eh0wJi3fT1K-JFU7NTAmSMZ2qFtkL94';
const bot = new TelegramBot(TOKEN, { polling: true });

const client = redis.createClient({
  password: '02H21j9N0zNO3M1mmWsMFAo006HfTln8',
  socket: {
    host: 'redis-19660.c264.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 19660,
  },
});

client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  const conn = await client.connect();
})();

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

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    'Welcome to the bot! Please enter your email address:'
  );
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (validEmail(msg.text)) {
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Save email and verification code to Redis
    await client.set(
      chatId.toString(),
      JSON.stringify({
        email: messageText,
        verificationCode: verificationCode,
        verified: false,
      })
    );

    // Send verification email
    sendVerificationEmail(messageText, verificationCode);

    // Prompt the user to enter the verification code
    bot.sendMessage(
      chatId,
      'Verification code sent to your email. Please enter the code:'
    );
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (validEmail(msg.text)) {
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await client.set(
      chatId.toString(),
      JSON.stringify({
        email: messageText,
        verificationCode: verificationCode,
        verified: false,
      })
    );

    sendVerificationEmail(messageText, verificationCode);

    bot.sendMessage(
      chatId,
      'Verification code sent to your email. Please enter the code:'
    );
  }

  if (/^\d{6}$/.test(messageText)) {
    const data = await client.get(chatId.toString());
    const parsedData = JSON.parse(data);
    if (parsedData?.verificationCode == messageText.toString()) {
      const userData = {
        chatId: chatId,
        first_name: msg.from.first_name,
        last_name: msg.from.last_name,
        username: msg.from.username,
        email: parsedData.email,
      };
      client.del(chatId.toString());

      bot.sendMessage(chatId, 'Congratulations, you are verified!');

      bot.sendMessage(chatId, 'What would you like to do?', {
        reply_markup: {
          keyboard: [
            [{ text: 'Option 1' }, { text: 'Option 2' }],
            [{ text: 'Option 3' }, { text: 'Option 4' }],
          ],
          resize_keyboard: true,
        },
      });
    } else {
      bot.sendMessage(chatId, 'Incorrect verification code. Please try again.');
    }
  }
});
