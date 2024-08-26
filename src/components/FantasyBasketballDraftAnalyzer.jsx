import { useState, useMemo } from 'react';
import { Box, Typography, Container, Paper, Grid } from '@mui/material';
import PlayerTable from './PlayerTable';
import ControlPanel from './ControlPanel';
import TeamList from './TeamList';
import GMStatsTable from './GMStatsTable';
import DraftGraph from './DraftGraph';
import SetupPage from './SetupPage';
import { players } from '../data/players';
import { analyzePlayer } from '../utils/calculations';

const FantasyBasketballDraftAnalyzer = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [teams, setTeams] = useState([]);
  const [playersPerTeam, setPlayersPerTeam] = useState(13);
  const [searchTerm, setSearchTerm] = useState("");
  const [draftedPlayers, setDraftedPlayers] = useState({});

  const handleSetupComplete = (setupTeams, setupPlayersPerTeam) => {
    setTeams(setupTeams.map(team => ({ 
      ...team, 
      players: [], 
      stats: {
        PTS: [], TREB: [], AST: [], STL: [], BLK: [], TPM: [], TO: [],
        FG: [], FGA: [], FT: [], FTA: []
      } 
    })));
    setPlayersPerTeam(setupPlayersPerTeam);
    setIsSetupComplete(true);
  };

  const analyzedPlayers = useMemo(() => {
    return players.map(player => {
      const analyzed = analyzePlayer(player, players, teams[0]?.budget || 200, playersPerTeam);
      const draftInfo = draftedPlayers[player.PLAYER];
      return {
        ...analyzed,
        isDrafted: !!draftInfo,
        draftedBy: draftInfo ? draftInfo.team : null,
        draftedFor: draftInfo ? draftInfo.price : 0,
      };
    });
  }, [teams, playersPerTeam, draftedPlayers]);

  const filteredPlayers = analyzedPlayers.filter(player =>
    player.PLAYER.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayerDrafted = (playerName, teamName, price) => {
    const player = players.find(p => p.PLAYER === playerName);
    setDraftedPlayers(prev => ({
      ...prev,
      [playerName]: { team: teamName, price }
    }));
    setTeams(prev => prev.map(team => 
      team.name === teamName 
        ? { 
            ...team, 
            budget: team.budget - price,
            players: [...team.players, playerName],
            stats: {
              PTS: [...team.stats.PTS, (team.stats.PTS[team.stats.PTS.length - 1] || 0) + player.PTS],
              TREB: [...team.stats.TREB, (team.stats.TREB[team.stats.TREB.length - 1] || 0) + player.TREB],
              AST: [...team.stats.AST, (team.stats.AST[team.stats.AST.length - 1] || 0) + player.AST],
              STL: [...team.stats.STL, (team.stats.STL[team.stats.STL.length - 1] || 0) + player.STL],
              BLK: [...team.stats.BLK, (team.stats.BLK[team.stats.BLK.length - 1] || 0) + player.BLK],
              TPM: [...team.stats.TPM, (team.stats.TPM[team.stats.TPM.length - 1] || 0) + player.TPM],
              TO: [...team.stats.TO, (team.stats.TO[team.stats.TO.length - 1] || 0) + player.TO],
              FG: [...team.stats.FG, (team.stats.FG[team.stats.FG.length - 1] || 0) + player.FG],
              FGA: [...team.stats.FGA, (team.stats.FGA[team.stats.FGA.length - 1] || 0) + (player.FGA || player.FG / player.FG)],
              FT: [...team.stats.FT, (team.stats.FT[team.stats.FT.length - 1] || 0) + player.FT],
              FTA: [...team.stats.FTA, (team.stats.FTA[team.stats.FTA.length - 1] || 0) + (player.FTA || player.FT / player.FT)],
            }
          } 
        : team
    ));
  };

  const handlePlayerUndrafted = (playerName) => {
    const draftInfo = draftedPlayers[playerName];
    if (!draftInfo) return;

    const player = players.find(p => p.PLAYER === playerName);
    setDraftedPlayers(prev => {
      const newDraftedPlayers = { ...prev };
      delete newDraftedPlayers[playerName];
      return newDraftedPlayers;
    });

    setTeams(prev => prev.map(team => 
      team.name === draftInfo.team 
        ? { 
            ...team, 
            budget: team.budget + draftInfo.price,
            players: team.players.filter(p => p !== playerName),
            stats: {
              PTS: team.stats.PTS.slice(0, -1),
              TREB: team.stats.TREB.slice(0, -1),
              AST: team.stats.AST.slice(0, -1),
              STL: team.stats.STL.slice(0, -1),
              BLK: team.stats.BLK.slice(0, -1),
              TPM: team.stats.TPM.slice(0, -1),
              TO: team.stats.TO.slice(0, -1),
              FG: team.stats.FG.slice(0, -1),
              FGA: team.stats.FGA.slice(0, -1),
              FT: team.stats.FT.slice(0, -1),
              FTA: team.stats.FTA.slice(0, -1),
            }
          } 
        : team
    ));
  };

  const totalPlayersLeft = (teams.length * playersPerTeam) - Object.keys(draftedPlayers).length;

  if (!isSetupComplete) {
    return <SetupPage onSetupComplete={handleSetupComplete} />;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Fantasy Basketball Draft Analyzer
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <ControlPanel
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <PlayerTable 
                players={filteredPlayers} 
                onPlayerDrafted={handlePlayerDrafted}
                onPlayerUndrafted={handlePlayerUndrafted}
                teams={teams}
                playersPerTeam={playersPerTeam}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <TeamList 
                teams={teams} 
                playersPerTeam={playersPerTeam} 
                totalPlayersLeft={totalPlayersLeft}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <GMStatsTable teams={teams} />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <DraftGraph teams={teams} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default FantasyBasketballDraftAnalyzer;