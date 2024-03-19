const TelegramBot = require('node-telegram-bot-api');
const redis = require('redis');
const nodemailer = require('nodemailer');

// Initialize bot
const TOKEN = '7023229435:AAH9Eh0wJi3fT1K-JFU7NTAmSMZ2qFtkL94';
const bot = new TelegramBot(TOKEN, { polling: true });

// Initialize Redis client
const client = redis.createClient({
  password: '02H21j9N0zNO3M1mmWsMFAo006HfTln8',
  socket: {
    host: 'redis-19660.c264.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 19660,
  },
});

client.on('error', (err) => console.log('Redis Client Error', err));

const connection = async () => {
  await client.connect();
};
connection();

// Function to generate a random verification code
function generateVerificationCode() {
  return Math.random().toString(36).substring(2, 8); // Generate a random 6-character alphanumeric code
}

// Function to send email with verification code
async function sendVerificationEmail(email, code) {
  // Create a transporter object
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'mohammadabbas434@gmail.com', // Add your Gmail email address
      pass: 'gpzk emcb xgxa cdqo', // Add your Gmail password (2 step verification passcode)
    },
  });

  // Setup email data
  const mailOptions = {
    from: 'mohammadabbas434@gmail.com',
    to: email,
    subject: 'Verification Code for Chat Bot',
    text: `Your verification code is: ${code}`,
  };

  //send email
  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully.');
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
}

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Send welcome message
  bot.sendMessage(
    chatId,
    'Welcome to the bot! Please enter your email address:'
  );
});

// Handle user's email input
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Check if the message is an email address
  if (/^\S+@\S+\.\S+$/.test(messageText)) {
    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Save email and verification code to Redis
    await client.hSet(chatId, {
      email: messageText,
      verificationCode: verificationCode,
      verified: false,
    });

    // Send verification email
    sendVerificationEmail(messageText, verificationCode);

    // Prompt the user to enter the verification code
    bot.sendMessage(
      chatId,
      'Verification code sent to your email. Please enter the code:'
    );
  } else {
    // Prompt the user to enter a valid email address
    bot.sendMessage(chatId, 'Please enter a valid email address.');
  }
});

// Handle verification code input
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Check if the message is a 6-digit verification code
  if (/^\d{6}$/.test(messageText)) {
    // Get email and verification code from Redis
    client.hGetAll(chatId, (err, data) => {
      if (err) {
        console.error('Error retrieving data from Redis:', err);
        return;
      }

      if (data && data.verificationCode === messageText) {
        // Mark user as verified in Redis
        client.hSet(chatId, 'verified', true);

        // Send congratulations message
        bot.sendMessage(chatId, 'Congratulations, you are verified!');

        // Show options for the user to continue using the bot
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
        // Notify the user about incorrect verification code
        bot.sendMessage(
          chatId,
          'Incorrect verification code. Please try again.'
        );
      }
    });
  }
});

// Handle button clicks
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Handle button clicks based on the message text
  switch (messageText) {
    case 'Option 1':
      bot.sendMessage(chatId, 'You clicked Option 1.');
      break;
    case 'Option 2':
      bot.sendMessage(chatId, 'You clicked Option 2.');
      break;
    case 'Option 3':
      bot.sendMessage(chatId, 'You clicked Option 3.');
      break;
    case 'Option 4':
      bot.sendMessage(chatId, 'You clicked Option 4.');
      break;
    default:
      console.log('Ignoring message:', messageText);
  }
});
