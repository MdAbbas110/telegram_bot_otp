const TelegramBot = require('node-telegram-bot-api');
// const img = require('./robo.jpg');

const TOKEN = '7023229435:AAH9Eh0wJi3fT1K-JFU7NTAmSMZ2qFtkL94';
const bot = new TelegramBot(TOKEN, { polling: true });

// Store chat IDs of users who have already started the bot
const startedUsers = new Set();

// Handle new messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Check if the user has already started the bot
  if (!startedUsers.has(chatId)) {
    // Send start button and set the user as started
    bot.sendMessage(chatId, 'Welcome to the bot!', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Start', callback_data: 'start' }]],
      },
    });
  }
});

// Handle callback queries
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // Handle callback data
  if (data === 'start') {
    // Send photo and set the user as started
    bot
      .sendPhoto(
        chatId,
        'https://img.freepik.com/free-photo/view-graphic-3d-robot_23-2150849173.jpg',
        {
          caption: 'Here is an image!',
        }
      )
      .then(() => {
        startedUsers.add(chatId);
      })
      .catch((err) => {
        console.error('Error sending photo:', err);
        bot.sendMessage(chatId, 'Error sending photo. Please try again later.');
      });
  }
});
