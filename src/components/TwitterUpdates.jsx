import { useState, useEffect, useCallback } from 'react';
import { TextField, Button, List, ListItem, ListItemText, Typography, Box, CircularProgress } from '@mui/material';

const TwitterUpdates = () => {
  const [tweets, setTweets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTweets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tweets');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTweets(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      setError("Failed to fetch tweets");
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

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

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setTimeout(() => connectWebSocket(), 5000); // Try to reconnect after 5 seconds
    };

    ws.onmessage = (event) => {
      try {
        const newTweets = JSON.parse(event.data);
        setTweets(prevTweets => {
          const combinedTweets = [...newTweets, ...prevTweets];
          // Remove duplicates and sort by date
          const uniqueTweets = Array.from(new Set(combinedTweets.map(t => t.id)))
            .map(id => combinedTweets.find(t => t.id === id))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          return uniqueTweets.slice(0, 100); // Limit to 100 tweets
        });
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    return ws;
  }, []);

  useEffect(() => {
    fetchTweets();
    const ws = connectWebSocket();
    return () => ws.close();
  }, [connectWebSocket]);

  const handleSearch = () => {
    if (searchQuery) {
      const filteredTweets = tweets.filter(tweet => 
        tweet.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tweet.account.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setTweets(filteredTweets);
    } else {
      fetchTweets(); // Reset to all tweets if search query is empty
    }
  };

  const handleRefresh = () => {
    fetchTweets();
  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Twitter Updates
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tweets or accounts"
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1, mr: 1 }}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
        <Button variant="outlined" onClick={handleRefresh} sx={{ ml: 1 }}>
          Refresh
        </Button>
      </Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Typography color={isConnected ? "success.main" : "error.main"} sx={{ mb: 2 }}>
        {isConnected ? "Connected to live updates" : "Disconnected from live updates"}
      </Typography>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <List>
          {tweets.map((tweet) => (
            <ListItem key={tweet.id} divider>
              <ListItemText
                primary={tweet.account}
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
      )}
    </Box>
  );
};

export default TwitterUpdates;