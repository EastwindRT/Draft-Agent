import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';

const SetupPage = ({ onSetupComplete }) => {
  const [myTeamName, setMyTeamName] = useState('');
  const [otherTeams, setOtherTeams] = useState(['']);
  const [playersPerTeam, setPlayersPerTeam] = useState(13);
  const [budget, setBudget] = useState(200);

  const handleAddTeam = () => {
    setOtherTeams([...otherTeams, '']);
  };

  const handleTeamNameChange = (index, value) => {
    const newTeams = [...otherTeams];
    newTeams[index] = value;
    setOtherTeams(newTeams);
  };

  const handleSubmit = () => {
    const allTeams = [{ name: myTeamName, budget }, ...otherTeams.map(name => ({ name, budget }))];
    onSetupComplete(allTeams, playersPerTeam);
  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
      <Typography 
        variant="h2" 
        component="h1" 
        gutterBottom 
        sx={{
          fontWeight: 'bold',
          color: '#1976d2',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          mb: 4
        }}
      >
        Fantasy Basketball Draft Setup
      </Typography>
      <TextField
        fullWidth
        label="Your Team Name"
        value={myTeamName}
        onChange={(e) => setMyTeamName(e.target.value)}
        margin="normal"
      />
      {otherTeams.map((team, index) => (
        <TextField
          key={index}
          fullWidth
          label={`Team ${index + 2} Name`}
          value={team}
          onChange={(e) => handleTeamNameChange(index, e.target.value)}
          margin="normal"
        />
      ))}
      <Button onClick={handleAddTeam} variant="outlined" sx={{ mt: 1, mb: 2 }}>
        Add Another Team
      </Button>
      <TextField
        fullWidth
        label="Players per Team"
        type="number"
        value={playersPerTeam}
        onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Budget per Team"
        type="number"
        value={budget}
        onChange={(e) => setBudget(Number(e.target.value))}
        margin="normal"
      />
      <Button onClick={handleSubmit} variant="contained" sx={{ mt: 2 }}>
        Start Draft
      </Button>
    </Box>
  );
};

export default SetupPage;