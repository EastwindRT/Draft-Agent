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
      const user = await client.v2.userByUsername(username);
      console.log(`Found user: ${JSON.stringify(user.data)}`);

      const userTweets = await client.v2.userTimeline(user.data.id, {
        exclude: ['retweets', 'replies'],
        max_results: 5,
        'tweet.fields': ['created_at', 'author_id', 'text'],
        expansions: ['author_id'],
        'user.fields': ['username', 'name']
      });

      const tweets = userTweets.data.data.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        username: user.data.username,
        name: user.data.name
      }));

      console.log(`Successfully fetched ${tweets.length} tweets for ${username}`);
      return tweets;
    } catch (error) {
      if (error.code === 429) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Rate limit hit. Waiting for ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`Error fetching tweets for ${username}:`, error);
        if (error.code) {
          console.error(`Error code: ${error.code}`);
        }
        if (error.data) {
          console.error('Error data:', error.data);
        }
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
    if (error.message.includes('after 3 attempts')) {
      res.status(429).json({ 
        status: 'error', 
        message: `Rate limit exceeded. Please try again later.`,
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: `Failed to fetch tweets for ${username}.`,
        error: error.message 
      });
    }
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