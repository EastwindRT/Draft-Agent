import { useState } from 'react';
import { Box, Typography, Button, TextField, Container, Grid, Paper } from '@mui/material';

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
    <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
      <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Draft Setup
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              id="myTeamName"
              name="myTeamName"
              label="Your Team Name"
              fullWidth
              variant="outlined"
              value={myTeamName}
              onChange={(e) => setMyTeamName(e.target.value)}
            />
          </Grid>
          {otherTeams.map((team, index) => (
            <Grid item xs={12} key={index}>
              <TextField
                required
                id={`team-${index + 2}`}
                name={`team-${index + 2}`}
                label={`Team ${index + 2} Name`}
                fullWidth
                variant="outlined"
                value={team}
                onChange={(e) => handleTeamNameChange(index, e.target.value)}
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button
              onClick={handleAddTeam}
              variant="outlined"
              fullWidth
            >
              Add Another Team
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              id="playersPerTeam"
              name="playersPerTeam"
              label="Players per Team"
              fullWidth
              variant="outlined"
              type="number"
              value={playersPerTeam}
              onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              id="budget"
              name="budget"
              label="Budget per Team"
              fullWidth
              variant="outlined"
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              onClick={handleSubmit}
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3, mb: 2 }}
            >
              Start Draft
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default SetupPage;