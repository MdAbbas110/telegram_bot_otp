const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Initialize bot
const TOKEN = '7023229435:AAH9Eh0wJi3fT1K-JFU7NTAmSMZ2qFtkL94';
const bot = new TelegramBot(TOKEN, { polling: true });

// Connect to MongoDB
mongoose
  .connect(
    'mongodb+srv://Abbas-admin:Yaalimadad110@cluster0.bjdhxec.mongodb.net/',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
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
      user: 'mohammadabbas434@gmail.com', // Add your Gmail email address
      pass: 'mwli sgfu rikv bkzo', // Add your Gmail password
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

// Handle /start command and deep linking
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Store the code in the database
  //   try {
  //     await OneTimeCode.create({ code });
  //   } catch (error) {
  //     console.error('Error storing one-time code:', error);
  //     bot.sendMessage(chatId, 'Internal server error. Please try again later.');
  //     return;
  //   }

  // Check if the user is already registered
  let user = await User.findOne({ chatId });
  if (user && user.verified) {
    bot.sendMessage(chatId, 'Welcome back!');
    return;
  }

  // Send the welcome message with functional buttons
  bot.sendMessage(chatId, 'Welcome to the bot! What would you like to do?', {
    reply_markup: {
      keyboard: [
        [{ text: 'Harsh help' }, { text: 'Ask your Doubt' }],
        [{ text: 'Options 1' }, { text: 'Option 4' }],
      ],
      resize_keyboard: true,
    },
  });
});

// Handle user's email input
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Check if the message is an email address
  if (/^\S+@\S+\.\S+$/.test(messageText)) {
    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Save user data to the database
    let user = await User.findOneAndUpdate(
      { chatId },
      { email: messageText, verificationCode, verified: false },
      { upsert: true, new: true }
    );

    // Send verification code to the user's email
    sendVerificationEmail(messageText, verificationCode);
    bot.sendMessage(
      chatId,
      'Verification code has been sent to your email address. Please enter the code:'
    );
  } else {
    bot.sendMessage(chatId, 'Verified account');
  }
});

// Handle verification code input
bot.onText(/^[0-9]{6}$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const verificationCode = match[0];

  // Check if the code matches the user's verification code
  let user = await User.findOne({ chatId, verificationCode });
  if (user) {
    // Update user's verification status
    await User.updateOne({ chatId }, { verified: true });

    // Welcome the user and allow them to use the bot
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

    // Remove the verification message handler to stop processing emails
    bot.removeTextListener(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  } else {
    bot.sendMessage(chatId, 'Incorrect verification code. Please try again.');
  }
});

// Handle button clicks
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Handle button clicks based on the message text
  switch (messageText) {
    case 'Harsh help':
      // Perform action for Option 1
      bot.sendMessage(
        chatId,
        'I can help you to grow your knowledge in the field of Bots'
      );
      break;
    case 'Ask your Doubt':
      // Perform action for Option 2
      bot.sendMessage(chatId, 'You can ask me any doubt related to you code ');
      break;
    case 'Option 1':
      // Perform action for Option 3
      bot.sendMessage(chatId, 'You clicked for other Options we can assist.');
      break;
    case 'Option 4':
      // Perform action for Option 4
      bot.sendMessage(chatId, 'You clicked for chit chat conversation.');
      break;
    default:
      // Ignore other messages
      console.log('Ignoring message:', messageText);
  }
});
