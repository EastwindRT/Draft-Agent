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

const ACCOUNTS_TO_FOLLOW = ['NBA', 'espn', 'BleacherReport', 'Ontheblock09', 'elonmusk', 'wojespn'];

async function fetchTweetsFromAccount(username) {
  try {
    console.log(`Fetching tweets from account: ${username}`);
    const user = await client.v2.userByUsername(username);
    const userTweets = await client.v2.userTimeline(user.data.id, {
      exclude: ['retweets', 'replies'],
      max_results: 5,
      'tweet.fields': ['created_at', 'author_id'],
      expansions: ['author_id'],
      'user.fields': ['username']
    });

    const tweets = userTweets.data.data.map(tweet => ({
      ...tweet,
      username: username
    }));

    console.log(`Successfully fetched ${tweets.length} tweets for ${username}`);
    return tweets;
  } catch (error) {
    console.error(`Error fetching tweets for ${username}:`, error);
    return [];
  }
}

// Root route
app.get('/', (req, res) => {
  res.send('Server is running. Use /api/fetch-tweets/:username to fetch tweets from a specific account.');
});

// API endpoint to fetch tweets from a single account
app.get('/api/fetch-tweets/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const tweets = await fetchTweetsFromAccount(username);
    res.json({ status: 'success', data: tweets });
  } catch (error) {
    console.error(`Error in /api/fetch-tweets/${username}:`, error);
    res.status(500).json({ status: 'error', message: `Failed to fetch tweets for ${username}. Check server logs for details.` });
  }
});

// API endpoint to list available accounts
app.get('/api/accounts', (req, res) => {
  res.json({ status: 'success', data: ACCOUNTS_TO_FOLLOW });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});