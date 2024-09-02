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

const ACCOUNTS_TO_FOLLOW = ['@NBA', '@espn', '@BleacherReport', '@TheAthletic'];

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

async function fetchAndStoreTweets() {
  for (const account of ACCOUNTS_TO_FOLLOW) {
    try {
      const user = await client.v2.userByUsername(account.replace('@', ''));
      const userTimeline = await client.v2.userTimeline(user.data.id, {
        exclude: ['retweets', 'replies'],
        max_results: 100,
        'tweet.fields': ['created_at', 'author_id'],
        expansions: ['author_id'],
        'user.fields': ['username'],
      });

      const newTweets = userTimeline.data.data.map(tweet => ({
        ...tweet,
        account: account
      }));

      // Store new tweets in the database
      const dbClient = await pool.connect();
      try {
        await dbClient.query('BEGIN');
        for (const tweet of newTweets) {
          await dbClient.query(
            'INSERT INTO tweets (id, text, created_at, account) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
            [tweet.id, tweet.text, tweet.created_at, tweet.account]
          );
        }
        await dbClient.query('COMMIT');
      } catch (e) {
        await dbClient.query('ROLLBACK');
        throw e;
      } finally {
        dbClient.release();
      }

      // Broadcast new tweets to connected clients
      wss.clients.forEach((wsClient) => {
        if (wsClient.readyState === WebSocketServer.OPEN) {
          wsClient.send(JSON.stringify(newTweets));
        }
      });
    } catch (error) {
      console.error(`Error fetching tweets for ${account}:`, error);
    }
  }
}

// Initialize the database and start fetching tweets
async function initialize() {
  await testDatabaseConnection();
  await createTweetsTable();
  await fetchAndStoreTweets();
  
  // Run fetchAndStoreTweets every 15 minutes
  setInterval(fetchAndStoreTweets, 15 * 60 * 1000);
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

// WebSocket connection handling
wss.on('connection', async (ws) => {
  console.log('Client connected to WebSocket');
  // Send current tweets to newly connected client
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM tweets WHERE created_at > NOW() - INTERVAL \'24 hours\' ORDER BY created_at DESC');
    ws.send(JSON.stringify(result.rows));
    client.release();
  } catch (err) {
    console.error('Error sending initial tweets to WebSocket client:', err);
  }
  
  ws.on('error', console.error);
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