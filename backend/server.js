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

const ACCOUNTS_TO_FOLLOW = ['NBA', 'espn', 'BleacherReport', 'Ontheblock09', 'X', 'wojespn'];

async function fetchTweetsFromAccount(username, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Fetching tweets from account: ${username} (Attempt ${attempt + 1}/${maxRetries})`);

      const searchResult = await client.v2.search(`from:${username} -is:retweet -is:reply`, {
        'tweet.fields': ['created_at', 'author_id'],
        'user.fields': ['username', 'name'],
        expansions: ['author_id'],
        max_results: 10
      });

      const tweets = searchResult.data.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        username: username,
        name: searchResult.includes.users.find(user => user.id === tweet.author_id).name
      }));

      console.log(`Successfully fetched ${tweets.length} tweets for ${username}`);
      return tweets;
    } catch (error) {
      console.error(`Error fetching tweets for ${username}:`, error);
      if (error.code) {
        console.error(`Error code: ${error.code}`);
      }
      if (error.data) {
        console.error('Error data:', error.data);
      }
      if (error.rateLimit) {
        console.error('Rate limit info:', error.rateLimit);
      }
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Failed to fetch tweets for ${username} after ${maxRetries} attempts`);
}

// Root route
app.get('/', (req, res) => {
  res.send('Server is running. Available endpoints: /api/accounts, /api/fetch-tweets/:username');
});

// API endpoint to list available accounts
app.get('/api/accounts', (req, res) => {
  console.log('Accessed /api/accounts endpoint');
  res.json({ status: 'success', data: ACCOUNTS_TO_FOLLOW });
});

// API endpoint to fetch tweets from a single account
app.get('/api/fetch-tweets/:username', async (req, res) => {
  const { username } = req.params;
  console.log(`Received request for tweets from: ${username}`);
  try {
    const tweets = await fetchTweetsFromAccount(username);
    res.json({ status: 'success', data: tweets });
  } catch (error) {
    console.error(`Error in /api/fetch-tweets/${username}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: `Failed to fetch tweets for ${username}.`,
      error: error.message 
    });
  }
});

// Catch-all route for undefined routes
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    status: 'error', 
    message: 'Not Found', 
    path: req.url 
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('  GET /');
  console.log('  GET /api/accounts');
  console.log('  GET /api/fetch-tweets/:username');
});