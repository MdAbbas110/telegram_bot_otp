const TelegramBot = require('node-telegram-bot-api');
const redis = require('redis');
const { validEmail, sendVerificationEmail } = require('../utils');

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

const inlineKeyboardOptions = [
  [
    { text: 'Mini App 1', callback_data: 'mini_app_1' },
    { text: 'Mini App 2', callback_data: 'mini_app_2' },
  ],
  [
    { text: 'Mini App 3', callback_data: 'mini_app_3' },
    { text: 'Mini App 4', callback_data: 'mini_app_4' },
  ],
];

// Handle inline queries
bot.on('inline_query', async (query) => {
  const miniAppOptions = inlineKeyboardOptions.map((row) =>
    row.map((button) => button.text)
  );

  bot.answerInlineQuery(
    query.id,
    miniAppOptions.map((option, index) => ({
      type: 'article',
      id: index.toString(),
      title: option,
      input_message_content: {
        message_text: `You selected: ${option}`,
      },
    }))
  );
});

// Handle inline button clicks
// bot.on("callback_query", async (query) => {
// 	const chatId = query.message.chat.id;
// 	const chosenMiniApp = query.data;

// 	// Perform action based on the chosen mini-app
// 	switch (chosenMiniApp) {
// 		case "mini_app_1":
// 			// Handle Mini App 1 action
// 			bot.sendMessage(chatId, "You selected Mini App 1");
// 			break;
// 		case "mini_app_2":
// 			// Handle Mini App 2 action
// 			bot.sendMessage(chatId, "You selected Mini App 2");
// 			break;
// 		// Handle other mini-apps similarly
// 		default:
// 			bot.sendMessage(chatId, "Invalid mini-app selection");
// 	}
// });

// bot.onText(/\/start/, async (msg) => {
// 	const chatId = msg.chat.id;

// 	bot.sendMessage(chatId, "Welcome to the bot! Please choose a mini-app:", {
// 		reply_markup: {
// 			inline_keyboard: inlineKeyboardOptions,
// 		},
// 	});
// });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const message = `Click on Yes to enter email!`;
  const keyboard = [
    [
      { text: 'Cancel', callback_data: 'cancel_email' },
      { text: 'Yes', callback_data: 'send_email' },
    ],
  ];

  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard },
  });

  // bot.sendMessage(
  // 	chatId,
  // 	"Welcome to the bot! Please enter your email address:"
  // );
});

// 	const chatId = msg.chat.id;
// 	const cardWithStartButton = {
// 		type: "photo",
// 		media: tgImage,
// 		caption: 'Welcome! Click the "Start" button to begin.',
// 		reply_markup: JSON.stringify({
// 			keyboard: [["Start"]],
// 			resize_keyboard: true,
// 			one_time_keyboard: true,
// 		}),
// 	};

// 	bot
// 		.sendMediaGroup(chatId, [cardWithStartButton])
// 		.then(() => console.log("Card with start button sent successfully"))
// 		.catch((error) =>
// 			console.error("Error sending card with start button:", error)
// 		);
// });

// bot.onText(/\/start/, async (msg) => {
// 	const chatId = msg.chat.id;
// 	const messageText = msg.text;

// 	if (validEmail(msg.text)) {
// 		const verificationCode = Math.floor(
// 			100000 + Math.random() * 900000
// 		).toString();

// 		// Save email and verification code to Redis
// 		await client.set(
// 			chatId.toString(),
// 			JSON.stringify({
// 				email: messageText,
// 				verificationCode: verificationCode,
// 				verified: false,
// 			})
// 		);

// 		// Send verification email
// 		await sendVerificationEmail(messageText, verificationCode);

// 		// Prompt the user to enter the verification code
// 		bot.sendMessage(
// 			chatId,
// 			"Verification code sent to your email. Please enter the code:"
// 		);
// 	}
// });

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;

  console.log(action);

  if (action == 'send_email') {
    bot.sendMessage(chatId, 'Welcome! Please enter your email address:');
  } else {
    bot.sendMessage(chatId, 'You have to be verified to use this app');
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (validEmail(messageText)) {
    const userData = await client.get(chatId.toString());

    const parsedData = JSON.parse(userData);
    if (parsedData.verified) {
      bot.sendMessage(
        chatId,
        'You are already verified, you can interact with the bot'
      );
    } else {
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
  } else if (/^\d{6}$/.test(messageText)) {
    const data = await client.get(chatId.toString());
    const parsedData = JSON.parse(data);
    if (parsedData?.verificationCode == messageText.toString()) {
      const userData = {
        chatId: chatId,
        username: msg.from.username,
        email: parsedData.email,
        verified: true,
      };

      await client.set(chatId.toString(), JSON.stringify(userData));

      bot.sendMessage(
        chatId,
        'You are now verified! Please enter your full name'
      );
    } else {
      bot.sendMessage(chatId, 'Incorrect verification code. Please try again.');
    }
  } else if (/^[\p{L}\s'-]+$/u.test(messageText)) {
    const data = await client.get(chatId.toString());
    const parsedData = JSON.parse(data);

    if (parsedData.verified) {
      const userData = {
        ...parsedData,
        full_name: messageText,
      };

      await client.set(chatId.toString(), JSON.stringify(userData));

      bot.sendMessage(
        chatId,
        'Thanks for the information. You can now interact with this bot'
      );
    } else {
      bot.sendMessage(chatId, 'You are not verified, please enter your email.');
    }
  }
});
