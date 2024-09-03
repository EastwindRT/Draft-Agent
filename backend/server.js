import express from 'express';
import { TwitterApi } from 'twitter-api-v2';

const app = express();

// Twitter API setup
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function testTwitterApiConnection() {
  try {
    console.log('Testing Twitter API connection...');

    // Attempt to get the authenticated user's information
    const result = await client.v2.me();

    console.log('Successfully connected to Twitter API');
    console.log('Authenticated user:', result.data);
    return true;
  } catch (error) {
    console.error('Error connecting to Twitter API:', error);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    if (error.data) {
      console.error('Error data:', error.data);
    }
    return false;
  }
}

// API endpoint to test Twitter connection
app.get('/api/test-twitter-connection', async (req, res) => {
  const success = await testTwitterApiConnection();
  if (success) {
    res.json({ status: 'success', message: 'Twitter API connection successful. Check server logs for details.' });
  } else {
    res.status(500).json({ status: 'error', message: 'Failed to connect to Twitter API. Check server logs for details.' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  testTwitterApiConnection(); // Test connection on startup
});