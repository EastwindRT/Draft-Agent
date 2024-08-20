import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const TeamList = ({ teams, playersPerTeam, totalPlayersLeft }) => {
  return (
    <div className="mt-8">
      <Typography variant="h5" gutterBottom>Team List</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>GM Name</TableCell>
              <TableCell>Remaining Budget</TableCell>
              <TableCell>Players Drafted</TableCell>
              <TableCell>Avg $/Player Left</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team) => {
              const playersLeft = playersPerTeam - team.players.length;
              const avgDollarPerPlayer = playersLeft > 0 ? team.budget / playersLeft : 0;
              return (
                <TableRow key={team.name}>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>${team.budget}</TableCell>
                  <TableCell>{team.players.length}/{playersPerTeam}</TableCell>
                  <TableCell>${avgDollarPerPlayer.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="body1" className="mt-2">
        Total players left to draft: {totalPlayersLeft}
      </Typography>
    </div>
  );
};

export default TeamList;