import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  TableSortLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const PlayerTable = ({ players, onPlayerDrafted, onPlayerUndrafted, teams, playersPerTeam }) => {
  const [draftInfo, setDraftInfo] = useState({});
  const [orderBy, setOrderBy] = useState('TOTAL');
  const [order, setOrder] = useState('desc');
  const [minimized, setMinimized] = useState(false);

  const handleDraftPlayer = (player) => {
    const info = draftInfo[player.PLAYER] || {};
    if (info.team && info.price) {
      onPlayerDrafted(player.PLAYER, info.team, Number(info.price));
      setDraftInfo(prev => ({ ...prev, [player.PLAYER]: {} }));
    }
  };

  const handleUndraftPlayer = (player) => {
    onPlayerUndrafted(player.PLAYER);
  };

  const handleDraftInfoChange = (player, field, value) => {
    setDraftInfo(prev => ({
      ...prev,
      [player.PLAYER]: { ...prev[player.PLAYER], [field]: value }
    }));
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'TO') {
        return order === 'asc' ? bValue - aValue : aValue - bValue;
      }

      if (bValue < aValue) {
        return order === 'asc' ? 1 : -1;
      }
      if (bValue > aValue) {
        return order === 'asc' ? -1 : 1;
      }
      return 0;
    });
  }, [players, order, orderBy]);

  const createSortHandler = (property) => () => {
    handleRequestSort(property);
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  return (
    <TableContainer component={Paper} sx={{ mb: 4 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <IconButton onClick={toggleMinimize} size="small">
                {minimized ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
              <TableSortLabel
                active={orderBy === 'PLAYER'}
                direction={orderBy === 'PLAYER' ? order : 'asc'}
                onClick={createSortHandler('PLAYER')}
              >
                Player
              </TableSortLabel>
            </TableCell>
            <TableCell>Pos</TableCell>
            <TableCell>Team</TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'TOTAL'}
                direction={orderBy === 'TOTAL' ? order : 'asc'}
                onClick={createSortHandler('TOTAL')}
              >
                Total
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'avgPlatformValue'}
                direction={orderBy === 'avgPlatformValue' ? order : 'asc'}
                onClick={createSortHandler('avgPlatformValue')}
              >
                Avg Value
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'PTS'}
                direction={orderBy === 'PTS' ? order : 'asc'}
                onClick={createSortHandler('PTS')}
              >
                PTS
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'TREB'}
                direction={orderBy === 'TREB' ? order : 'asc'}
                onClick={createSortHandler('TREB')}
              >
                REB
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'AST'}
                direction={orderBy === 'AST' ? order : 'asc'}
                onClick={createSortHandler('AST')}
              >
                AST
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'STL'}
                direction={orderBy === 'STL' ? order : 'asc'}
                onClick={createSortHandler('STL')}
              >
                STL
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'BLK'}
                direction={orderBy === 'BLK' ? order : 'asc'}
                onClick={createSortHandler('BLK')}
              >
                BLK
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'TPM'}
                direction={orderBy === 'TPM' ? order : 'asc'}
                onClick={createSortHandler('TPM')}
              >
                3PT
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'TO'}
                direction={orderBy === 'TO' ? order : 'asc'}
                onClick={createSortHandler('TO')}
              >
                TO
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'FG'}
                direction={orderBy === 'FG' ? order : 'asc'}
                onClick={createSortHandler('FG')}
              >
                FG%
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'FT'}
                direction={orderBy === 'FT' ? order : 'asc'}
                onClick={createSortHandler('FT')}
              >
                FT%
              </TableSortLabel>
            </TableCell>
            <TableCell>Draft Info</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedPlayers.map((player, index) => (
            <TableRow key={index} sx={{ 
              backgroundColor: player.isDrafted ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
              },
            }}>
              <TableCell>
                {minimized ? (
                  <Tooltip title={player.PLAYER}>
                    <span>{player.PLAYER.substring(0, 3)}...</span>
                  </Tooltip>
                ) : (
                  player.PLAYER
                )}
              </TableCell>
              <TableCell>{player.POS}</TableCell>
              <TableCell>{player.TEAM}</TableCell>
              <TableCell>{player.TOTAL.toFixed(2)}</TableCell>
              <TableCell>${player.avgPlatformValue.toFixed(2)}</TableCell>
              <TableCell>{player.PTS.toFixed(1)}</TableCell>
              <TableCell>{player.TREB.toFixed(1)}</TableCell>
              <TableCell>{player.AST.toFixed(1)}</TableCell>
              <TableCell>{player.STL.toFixed(1)}</TableCell>
              <TableCell>{player.BLK.toFixed(1)}</TableCell>
              <TableCell>{player.TPM.toFixed(1)}</TableCell>
              <TableCell>{player.TO.toFixed(1)}</TableCell>
              <TableCell>{(player.FG * 100).toFixed(1)}%</TableCell>
              <TableCell>{(player.FT * 100).toFixed(1)}%</TableCell>
              <TableCell>
                {player.isDrafted ? (
                  <>
                    {player.draftedBy} - ${player.draftedFor}
                    <Tooltip title="Undraft">
                      <Button 
                        onClick={() => handleUndraftPlayer(player)} 
                        size="small" 
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        Undraft
                      </Button>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Select
                      value={draftInfo[player.PLAYER]?.team || ''}
                      onChange={(e) => handleDraftInfoChange(player, 'team', e.target.value)}
                      displayEmpty
                      size="small"
                      sx={{ width: 120, mr: 1 }}
                    >
                      <MenuItem value="" disabled>Select GM</MenuItem>
                      {teams.map(team => (
                        <MenuItem key={team.name} value={team.name}>
                          {team.name} ({team.players.length}/{playersPerTeam})
                        </MenuItem>
                      ))}
                    </Select>
                    <TextField
                      label="$"
                      type="number"
                      value={draftInfo[player.PLAYER]?.price || ''}
                      onChange={(e) => handleDraftInfoChange(player, 'price', e.target.value)}
                      size="small"
                      sx={{ width: 70, mr: 1 }}
                    />
                    <Button 
                      onClick={() => handleDraftPlayer(player)} 
                      variant="contained" 
                      size="small"
                      disabled={!draftInfo[player.PLAYER]?.team || !draftInfo[player.PLAYER]?.price}
                    >
                      Draft
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PlayerTable;