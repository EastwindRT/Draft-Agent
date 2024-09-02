import express from 'express';
import { TwitterApi } from 'twitter-api-v2';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});
app.use((req, res, next) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.jsx')) {
    res.type('application/javascript');
  }
  next();
});
// Twitter API setup
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Manual rate limiting function
const rateLimitedRequest = async (requestFunction) => {
  const maxRetries = 3;
  const retryDelay = 60000; // 1 minute

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFunction();
    } catch (error) {
      if (error.code === 429 && attempt < maxRetries - 1) {
        console.log(`Rate limit hit. Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        throw error;
      }
    }
  }
};

// Configure the Twitter accounts to monitor
const ACCOUNTS_TO_FOLLOW = ['@NBA', '@espn', '@BleacherReport', '@TheAthletic'];

// Fetch tweets from specified accounts
async function fetchTweets() {
  const tweets = [];
  for (const account of ACCOUNTS_TO_FOLLOW) {
    try {
      const user = await rateLimitedRequest(() => client.v2.userByUsername(account.replace('@', '')));
      const userTimeline = await rateLimitedRequest(() => client.v2.userTimeline(user.data.id, {
        exclude: ['retweets', 'replies'],
        max_results: 5,
        'tweet.fields': ['created_at', 'author_id'],
        expansions: ['author_id'],
        'user.fields': ['username'],
      }));
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
  try {
    const tweets = await fetchTweets();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocketServer.OPEN) {
        client.send(JSON.stringify(tweets));
      }
    });
  } catch (error) {
    console.error('Error fetching or broadcasting tweets:', error);
  }
}, 300000); // Update every 5 minutes

// API endpoint for searching tweets
app.post('/api/search-tweets', async (req, res) => {
  const { query } = req.body;
  try {
    const searchResults = await rateLimitedRequest(() => client.v2.search(query, {
      'tweet.fields': ['created_at', 'author_id'],
      expansions: ['author_id'],
      'user.fields': ['username'],
    }));
    res.json(searchResults.data);
  } catch (error) {
    console.error('Error searching tweets:', error);
    res.status(500).json({ error: 'An error occurred while searching tweets', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Logging and directory setup
const rootDir = path.join(__dirname, '..');
const buildDir = path.join(rootDir, 'build');

console.log('Current directory:', process.cwd());
console.log('Root directory:', rootDir);
console.log('Build directory:', buildDir);
console.log('Build directory exists:', fs.existsSync(buildDir));
console.log('Contents of root directory:', fs.readdirSync(rootDir));

// Serve static files with fallback
const staticPath = fs.existsSync(buildDir) ? buildDir : rootDir;
app.use(express.static(staticPath));

// The "catchall" handler with error handling
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`index.html not found in ${staticPath}`);
    res.status(404).send('Not found');
  }
});

// Determine the correct port
const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Log environment variables and paths
console.log('Environment variables:');
console.log('TWITTER_API_KEY is set:', !!process.env.TWITTER_API_KEY);
console.log('TWITTER_API_SECRET is set:', !!process.env.TWITTER_API_SECRET);
console.log('TWITTER_ACCESS_TOKEN is set:', !!process.env.TWITTER_ACCESS_TOKEN);
console.log('TWITTER_ACCESS_SECRET is set:', !!process.env.TWITTER_ACCESS_SECRET);
console.log('PORT:', process.env.PORT);
console.log('Attempting to serve static files from:', staticPath);