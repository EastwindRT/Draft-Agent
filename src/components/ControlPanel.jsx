import React from 'react';
import { TextField, Box } from '@mui/material';

const ControlPanel = ({ searchTerm, setSearchTerm }) => {
  return (
    <Box className="mb-4">
      <TextField
        label="Search Player"
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter player name"
        fullWidth
      />
    </Box>
  );
};

export default ControlPanel;