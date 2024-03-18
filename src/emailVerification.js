const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Initialize bot
const TOKEN = '7023229435:AAH9Eh0wJi3fT1K-JFU7NTAmSMZ2qFtkL94';
const bot = new TelegramBot(TOKEN, { polling: true });

// Connect to MongoDB
mongoose
  .connect('Your_String.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

// Define schema for storing one-time codes
const userSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, unique: true },
  email: { type: String, required: true },
  verificationCode: { type: String, required: true },
  verified: { type: Boolean, default: false },
});

// Define model based on schema
const User = mongoose.model('User', userSchema);

// Function to generate a random one-time code
function generateVerificationCode() {
  return Math.random().toString(36).substring(2, 8); // Generate a random 6-character alphanumeric code
}

// Function to send email with verification code
async function sendVerificationEmail(email, code) {
  // Create a transporter object
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'Your_email', // Add your Gmail email address
      pass: 'your_2step_passcode', // Add your Gmail password (2 step verification passcode)
    },
  });

  // Setup email data
  const mailOptions = {
    from: 'your_email',
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

// Handle /start command and deep linking

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const existingUser = await User.findOne({ chatId });

  if (existingUser && existingUser.verified) {
    bot.sendMessage(chatId, 'Welcome back!');
  } else {
    bot.sendMessage(chatId, 'Welcome! Please enter your email address:');

    bot.once('message', async (msg) => {
      const email = msg.text.trim();

      if (/^\S+@\S+\.\S+$/.test(email)) {
        const verificationCode = generateVerificationCode();

        try {
          await User.findOneAndUpdate(
            { chatId },
            { email, verificationCode, verified: false },
            { upsert: true }
          );

          await sendVerificationEmail(email, verificationCode);
          bot.sendMessage(chatId, 'Verification code sent to your email.');
        } catch (error) {
          console.error('Error saving user data:', error);
          bot.sendMessage(
            chatId,
            'Internal server error. Please try again later.'
          );
        }
      } else {
        bot.sendMessage(chatId, 'Please enter a valid email address.');
      }
    });
  }
});

// Handle verification code input
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const verificationCode = msg.text.trim();

  const user = await User.findOne({ chatId, verificationCode });

  if (user) {
    await User.updateOne({ chatId }, { verified: true });
    bot.sendMessage(chatId, 'Congratulations, you are verified!');
  } else {
    bot.sendMessage(chatId, 'Sending verification code.');
  }
});

// Function to send options after verification
function sendOptions(chatId) {
  bot.sendMessage(chatId, 'What would you like to do?', {
    reply_markup: {
      keyboard: [
        [{ text: 'Option 1' }, { text: 'Option 2' }],
        [{ text: 'Option 3' }, { text: 'Option 4' }],
      ],
      resize_keyboard: true,
    },
  });
}

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
