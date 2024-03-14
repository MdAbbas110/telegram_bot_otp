const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '7023229435:AAH9Eh0wJi3fT1K-JFU7NTAmSMZ2qFtkL94';

const bot = new TelegramBot(TOKEN, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // Check if the message starts with "/start" followed by a parameter
  if (msg.text.startsWith('/start ')) {
    const allegedCode = msg.text.split(' ')[1]; // Extract the alleged code

    // Call the function from deepLinkHandler to verify code and associate user
    const user = await deepLinkHandler.verifyCode(allegedCode, chatId);

    if (user) {
      // Code verified! Welcome the user by username
      bot.sendMessage(chatId, `Hello, ${user.username}! Welcome to the bot.`);
      // Provide options based on authenticated status
      // ...
    } else {
      bot.sendMessage(
        chatId,
        'Invalid code. Please try again or generate a new one from your account.'
      );
    }
  } else if (options.includes(msg.text)) {
    // Handle user choices from the initial greeting message
    // ... (existing code remains the same)
  }
});

bot.on('polling_error', (error) => {
  console.log(error); // Log any errors encountered during polling
});

bot.startPolling().then(() => {
  console.log('Bot is up and running!');
});

// Replace with options for the initial greeting message
const options = [
  'Get some jokes',
  'Learn more about the bot',
  'Something else (type your request)',
];
