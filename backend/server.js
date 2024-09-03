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

async function fetchTweetsFromAccounts(accounts, maxTweets = 10) {
  try {
    console.log(`Fetching tweets from accounts: ${accounts.join(', ')}`);
    const tweets = [];

    for (const account of accounts) {
      const user = await client.v2.userByUsername(account);
      const userTweets = await client.v2.userTimeline(user.data.id, {
        exclude: ['retweets', 'replies'],
        max_results: maxTweets,
        'tweet.fields': ['created_at', 'author_id'],
        expansions: ['author_id'],
        'user.fields': ['username']
      });

      tweets.push(...userTweets.data.data.map(tweet => ({
        ...tweet,
        username: account
      })));
    }

    console.log(`Successfully fetched ${tweets.length} tweets`);
    return tweets;
  } catch (error) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
}

// Root route
app.get('/', (req, res) => {
  res.send('Server is running. Use /api/fetch-tweets to fetch tweets from specified accounts.');
});

// API endpoint to fetch tweets
app.get('/api/fetch-tweets', async (req, res) => {
  try {
    const tweets = await fetchTweetsFromAccounts(ACCOUNTS_TO_FOLLOW);
    res.json({ status: 'success', data: tweets });
  } catch (error) {
    console.error('Error in /api/fetch-tweets:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tweets. Check server logs for details.' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});