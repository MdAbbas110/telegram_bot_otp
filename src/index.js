const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');

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
const oneTimeCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: '1d' }, // Code expires after 1 day
});

// Define model based on schema
const OneTimeCode = mongoose.model('OneTimeCode', oneTimeCodeSchema);

// Function to generate a random one-time code
function generateOneTimeCode() {
  const code = Math.random().toString(36).substring(2, 8); // Generate a random 6-character alphanumeric code
  console.log('Generated one-time code:', code);
  return code;
}

// Function to send a message with the one-time code to a user
function sendOneTimeCode(chatId, code) {
  console.log('Sending one-time code to user:', code);
  // Send the one-time code to the user
  bot.sendMessage(chatId, 'Your one-time code is: ' + code);
}

// Handle /start command and deep linking
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Generate a one-time code
  const code = generateOneTimeCode();

  // Store the code in the database
  try {
    await OneTimeCode.create({ code });
  } catch (error) {
    console.error('Error storing one-time code:', error);
    bot.sendMessage(chatId, 'Internal server error. Please try again later.');
    return;
  }

  // Send the code to the user
  sendOneTimeCode(chatId, code);

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
