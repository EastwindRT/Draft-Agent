import express from 'express';
import { TwitterApi } from 'twitter-api-v2';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.EXTERNAL_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Twitter API setup
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const ACCOUNTS_TO_FOLLOW = ['@NBA', '@espn', '@BleacherReport', '@Ontheblock09', '@elonmusk', '@wojespn'];

async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    client.release();
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
}

async function createTweetsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tweets (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        account TEXT NOT NULL
      )
    `);
    console.log('Tweets table created successfully');
  } catch (err) {
    console.error('Error creating tweets table:', err);
  } finally {
    client.release();
  }
}

async function fetchTweetsWithBackoff(username, maxRetries = 10, maxResults = 10) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      console.log(`Attempting to fetch tweets for @${username}...`);
      const user = await client.v2.userByUsername(username);
      console.log(`Found user ID for @${username}: ${user.data.id}`);
      const userTimeline = await client.v2.userTimeline(user.data.id, {
        exclude: ['retweets', 'replies'],
        max_results: maxResults,
        'tweet.fields': ['created_at', 'author_id'],
        expansions: ['author_id'],
        'user.fields': ['username'],
      });
      console.log(`Successfully fetched ${userTimeline.data.data.length} tweets for @${username}`);
      return userTimeline.data.data.map(tweet => ({
        ...tweet,
        account: `@${username}`
      }));
    } catch (error) {
      console.error(`Error fetching tweets for @${username}:`, error);
      if (error.code === 429) {
        retries++;
        const delay = Math.min(Math.pow(2, retries) * 1000, 60000); // Max delay of 1 minute
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Max retries reached. Unable to fetch tweets for @${username}.`);
}

async function storeTweets(tweets) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const tweet of tweets) {
      await client.query(
        'INSERT INTO tweets (id, text, created_at, account) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [tweet.id, tweet.text, tweet.created_at, tweet.account]
      );
    }
    await client.query('COMMIT');
    console.log(`Stored ${tweets.length} tweets in the database`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(`Error storing tweets:`, e);
    throw e;
  } finally {
    client.release();
  }
}

async function fetchAndStoreTweets() {
  console.log('Starting fetchAndStoreTweets cycle...');
  for (const account of ACCOUNTS_TO_FOLLOW) {
    try {
      console.log(`Processing account: ${account}`);
      const newTweets = await fetchTweetsWithBackoff(account.replace('@', ''));
      console.log(`Fetched ${newTweets.length} tweets for ${account}`);
      
      if (newTweets.length > 0) {
        await storeTweets(newTweets);
        console.log(`Stored ${newTweets.length} tweets for ${account} in the database`);

        // Broadcast new tweets to connected clients
        wss.clients.forEach((wsClient) => {
          if (wsClient.readyState === WebSocketServer.OPEN) {
            wsClient.send(JSON.stringify(newTweets));
          }
        });
        console.log(`Broadcasted ${newTweets.length} new tweets to ${wss.clients.size} clients`);
      } else {
        console.log(`No new tweets found for ${account}`);
      }
    } catch (error) {
      console.error(`Error processing tweets for ${account}:`, error);
    }
    console.log(`Waiting 1 minute before processing next account...`);
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
  console.log('Finished fetchAndStoreTweets cycle.');
}

function scheduleTweetFetching() {
  console.log('Setting up tweet fetching schedule...');
  setInterval(() => {
    console.log('Running scheduled tweet fetch...');
    fetchAndStoreTweets();
  }, 30 * 60 * 1000); // Run every 30 minutes
  console.log('Initial tweet fetch on startup...');
  fetchAndStoreTweets(); // Run immediately on startup
}

async function initialize() {
  await testDatabaseConnection();
  await createTweetsTable();
  scheduleTweetFetching();
}

initialize();

// API endpoint to get tweets from the last 24 hours
app.get('/api/tweets', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM tweets WHERE created_at > NOW() - INTERVAL \'24 hours\' ORDER BY created_at DESC');
    res.json(result.rows);
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching tweets' });
  }
});

// New endpoint to fetch tweets for a single account
app.get('/api/fetch-account/:account', async (req, res) => {
  const account = req.params.account;
  console.log(`Received request to fetch tweets for ${account}`);
  try {
    const tweets = await fetchTweetsWithBackoff(account.replace('@', ''));
    console.log(`Fetched ${tweets.length} tweets for ${account}`);
    if (tweets.length > 0) {
      await storeTweets(tweets);
      console.log(`Stored ${tweets.length} tweets for ${account} in the database`);
    }
    res.json({ success: true, message: `Fetched and stored ${tweets.length} tweets for ${account}` });
  } catch (error) {
    console.error(`Error fetching tweets for ${account}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// New endpoint to fetch recent tweets for all accounts
app.get('/api/fetch-recent-tweets', async (req, res) => {
  console.log('Received request to fetch recent tweets for all accounts');
  const results = [];
  for (const account of ACCOUNTS_TO_FOLLOW) {
    try {
      console.log(`Fetching tweets for ${account}`);
      const tweets = await fetchTweetsWithBackoff(account.replace('@', ''), 10, 5);  // Fetch up to 5 tweets per account
      console.log(`Fetched ${tweets.length} tweets for ${account}`);
      results.push({ account, tweets });
    } catch (error) {
      console.error(`Error fetching tweets for ${account}:`, error);
      results.push({ account, error: error.message });
    }
    // Wait for 10 seconds before processing the next account to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  res.json(results);
});

// WebSocket connection handling
wss.on('connection', async (ws) => {
  console.log('Client connected to WebSocket');
  // Send current tweets to newly connected client
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM tweets WHERE created_at > NOW() - INTERVAL \'24 hours\' ORDER BY created_at DESC');
    ws.send(JSON.stringify(result.rows));
    console.log(`Sent ${result.rows.length} tweets to new WebSocket client`);
    client.release();
  } catch (err) {
    console.error('Error sending initial tweets to WebSocket client:', err);
  }

  ws.on('error', (error) => console.error('WebSocket error:', error));
  ws.on('close', () => console.log('Client disconnected from WebSocket'));
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});