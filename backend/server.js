import express from 'express';
import { TwitterApi } from 'twitter-api-v2';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Twitter API setup with rate limiting
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rateLimitedClient = client.readOnly.rateLimitedRequest({
  maxRetries: 3,
  retryDelay: 60000,
});

// Configure the Twitter accounts to monitor
const ACCOUNTS_TO_FOLLOW = ['@NBA', '@espn', '@BleacherReport', '@TheAthletic'];

// Fetch tweets from specified accounts
async function fetchTweets() {
  const tweets = [];
  for (const account of ACCOUNTS_TO_FOLLOW) {
    try {
      const user = await rateLimitedClient.v2.userByUsername(account.replace('@', ''));
      const userTimeline = await rateLimitedClient.v2.userTimeline(user.data.id, {
        exclude: ['retweets', 'replies'],
        max_results: 5,
        'tweet.fields': ['created_at', 'author_id'],
        expansions: ['author_id'],
        'user.fields': ['username'],
      });
      tweets.push(...userTimeline.data.data.map(tweet => ({
        ...tweet,
        account: account
      })));
    } catch (error) {
      console.error(`Error fetching tweets for ${account}:`, error);
    }
  }
  return tweets;
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  ws.on('close', (code, reason) => {
    console.log(`Client disconnected from WebSocket. Code: ${code}, Reason: ${reason}`);
  });
});

// Periodically fetch tweets and broadcast to connected clients
setInterval(async () => {
  const tweets = await fetchTweets();
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocketServer.OPEN) {
      client.send(JSON.stringify(tweets));
    }
  });
}, 300000); // Update every 5 minutes

// API endpoint for searching tweets
app.post('/api/search-tweets', async (req, res) => {
  const { query } = req.body;
  try {
    const searchResults = await rateLimitedClient.v2.search(query, {
      'tweet.fields': ['created_at', 'author_id'],
      expansions: ['author_id'],
      'user.fields': ['username'],
    });
    res.json(searchResults.data);
  } catch (error) {
    console.error('Error searching tweets:', error);
    res.status(500).json({ error: 'An error occurred while searching tweets', details: error.message });
  }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Determine the correct port
const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Log environment variables and paths (for debugging, remove in production)
console.log('Environment variables:');
console.log('TWITTER_API_KEY is set:', !!process.env.TWITTER_API_KEY);
console.log('TWITTER_API_SECRET is set:', !!process.env.TWITTER_API_SECRET);
console.log('TWITTER_ACCESS_TOKEN is set:', !!process.env.TWITTER_ACCESS_TOKEN);
console.log('TWITTER_ACCESS_SECRET is set:', !!process.env.TWITTER_ACCESS_SECRET);
console.log('PORT:', process.env.PORT);
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Attempting to serve static files from:', path.join(__dirname, '..', 'dist'));