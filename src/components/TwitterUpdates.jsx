import { useState, useEffect, useCallback } from 'react';
import { TextField, Button, List, ListItem, ListItemText, Typography, Box } from '@mui/material';

const TwitterUpdates = () => {
  const [tweets, setTweets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWebSocket = useCallback(() => {
    console.log("Attempting to connect to WebSocket");
    
    let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;
    let wsUrl;

    if (process.env.NODE_ENV === 'development') {
      wsUrl = `${protocol}//localhost:3002`;
    } else if (window.location.hostname.includes('replit.dev')) {
      wsUrl = `wss://${host}`;
    } else {
      wsUrl = `${protocol}//${host}`;
    }

    console.log("Connecting to WebSocket URL:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setError(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Failed to connect to WebSocket");
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      setIsConnected(false);
      setTimeout(() => connectWebSocket(), 5000); // Try to reconnect after 5 seconds
    };

    ws.onmessage = (event) => {
      console.log("Received WebSocket message:", event.data);
      try {
        const newTweets = JSON.parse(event.data);
        setTweets(prevTweets => [...newTweets, ...prevTweets].slice(0, 10));
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        setError("Error processing tweets");
      }
    };

    return ws;
  }, []);

  useEffect(() => {
    const ws = connectWebSocket();
    return () => {
      console.log("Closing WebSocket connection");
      ws.close();
    };
  }, [connectWebSocket]);

  const handleSearch = async () => {
    try {
      const response = await fetch('/api/search-tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTweets(data);
      setError(null);
    } catch (error) {
      console.error('Error searching tweets:', error);
      setError("Failed to search tweets");
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
      <TextField
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tweets or hashtags"
        margin="normal"
      />
      <Button variant="contained" onClick={handleSearch} sx={{ mt: 1, mb: 2 }}>
        Search
      </Button>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Typography color={isConnected ? "success" : "error"} sx={{ mb: 2 }}>
        {isConnected ? "Connected to live updates" : "Disconnected from live updates"}
      </Typography>
      <List>
        {tweets.map((tweet, index) => (
          <ListItem key={tweet.id || index} divider>
            <ListItemText
              primary={tweet.account || "Unknown Account"}
              secondary={
                <>
                  <Typography component="span" variant="body2">
                    {tweet.text}
                  </Typography>
                  <Typography component="span" variant="caption" display="block">
                    {new Date(tweet.created_at).toLocaleString()}
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default TwitterUpdates;