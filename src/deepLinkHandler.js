const { MongoClient } = require('mongodb'); // Assuming MongoDB for demonstration

// Replace with your MongoDB connection details (URI, username, password)
const mongoClient = new MongoClient('mongodb://YOUR_MONGO_URI', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyCode(allegedCode, chatId) {
  try {
    // Connect to MongoDB
    await mongoClient.connect();
    const db = mongoClient.db('YOUR_DATABASE_NAME');
    const collection = db.collection('codes');

    // Search for code in database
    const codeRecord = await collection.findOne({ unique_code: allegedCode });

    if (codeRecord) {
      // Check if code is expired (replace with your logic)
      const now = new Date();
      if (now.getTime() > codeRecord.expiry.getTime()) {
        return null; // Code expired
      } else {
        // Code is valid! Return the associated username
        return { username: codeRecord.username };
      }
    } else {
      return null; // Code not found
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    // Handle potential errors during database connection or query
  } finally {
    // Close MongoDB connection (replace with your error handling)
    await mongoClient.close();
  }
}
mongoose.connect(
  'mongodb+srv://Abbas-admin:Yaalimadad110@cluster0.bjdhxec.mongodb.net/',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
