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

// Check for required environment variables
const requiredEnvVars = [
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET',
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET',
  'EXTERNAL_DATABASE_URL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Error: Environment variable ${varName} is not set.`);
  } else {
    const value = process.env[varName];
    // Log the last 4 characters of each variable for verification
    console.log(`${varName} is set. Last 4 characters: ****${value.substring(value.length - 4)}`);
  }
});

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

const ACCOUNTS_TO_FOLLOW = ['NBA', 'espn', 'BleacherReport', 'Ontheblock09', 'elonmusk', 'wojespn'];

async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    client.release();
    return true;
  } catch (err) {
    console.error('Error connecting to the database:', err);
    return false;
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
    return true;
  } catch (err) {
    console.error('Error creating tweets table:', err);
    return false;
  } finally {
    client.release();
  }
}

async function testTwitterApiConnection() {
  try {
    console.log('Testing Twitter API connection...');

    // Fetch user details instead of searching for tweets
    const result = await client.v2.user('Twitter', {
      'user.fields': ['description', 'created_at']
    });

    if (result.data) {
      console.log('Successfully retrieved user details:');
      console.log(`Username: @${result.data.username}`);
      console.log(`Name: ${result.data.name}`);
      console.log(`Description: ${result.data.description}`);
      console.log(`Created at: ${result.data.created_at}`);
      return true;
    } else {
      console.log('User not found, but API request was successful.');
      return true;
    }
  } catch (error) {
    console.error('Error testing Twitter API connection:', error);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    if (error.data) {
      console.error('Error data:', error.data);
    }
    return false;
  }
}

async function initialize() {
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    await createTweetsTable();
  }
  await testTwitterApiConnection();
}

initialize();

// API endpoint to test Twitter connection
app.get('/api/test-twitter-connection', async (req, res) => {
  const success = await testTwitterApiConnection();
  if (success) {
    res.json({ status: 'success', message: 'Twitter API connection successful. Check server logs for details.' });
  } else {
    res.status(500).json({ status: 'error', message: 'Failed to connect to Twitter API. Check server logs for details.' });
  }
});

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