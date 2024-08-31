import { useState, useEffect } from 'react';
import { TextField, Button, List, ListItem, ListItemText, Typography } from '@mui/material';

const TwitterUpdates = () => {
  const [tweets, setTweets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Use wss:// for secure WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}`);

    ws.onmessage = (event) => {
      const newTweets = JSON.parse(event.data);
      setTweets(prevTweets => [...newTweets, ...prevTweets].slice(0, 10));
    };

    return () => ws.close();
  }, []);

  const handleSearch = async () => {
    try {
      const response = await fetch('/api/search-tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      setTweets(data);
    } catch (error) {
      console.error('Error searching tweets:', error);
    }
  };

  return (
    <div>
      <TextField
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tweets or hashtags"
      />
      <Button onClick={handleSearch}>Search</Button>
      <List>
        {tweets.map(tweet => (
          <ListItem key={tweet.id}>
            <ListItemText
              primary={tweet.account}
              secondary={
                <>
                  <Typography component="span" variant="body2">
                    {tweet.text}
                  </Typography>
                  <Typography component="span" variant="caption">
                    {new Date(tweet.created_at).toLocaleString()}
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default TwitterUpdates;