import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TableSortLabel } from '@mui/material';

const GMStatsTable = ({ teams }) => {
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');

  const statCategories = ['PTS', 'TREB', 'AST', 'STL', 'BLK', 'TPM', 'TO', 'FG', 'FT'];

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getLatestStat = (team, category) => {
    const statArray = team.stats[category];
    return statArray.length > 0 ? statArray[statArray.length - 1] : 0;
  };

  const calculatePercentage = (makes, attempts) => {
    const makesValue = makes.length > 0 ? makes[makes.length - 1] : 0;
    const attemptsValue = attempts.length > 0 ? attempts[attempts.length - 1] : 0;
    return attemptsValue > 0 ? (makesValue / attemptsValue * 100).toFixed(1) : '0.0';
  };

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (!orderBy) return 0;

      let aValue, bValue;

      if (orderBy === 'FG' || orderBy === 'FT') {
        aValue = parseFloat(calculatePercentage(a.stats[orderBy], a.stats[orderBy + 'A']));
        bValue = parseFloat(calculatePercentage(b.stats[orderBy], b.stats[orderBy + 'A']));
      } else {
        aValue = getLatestStat(a, orderBy);
        bValue = getLatestStat(b, orderBy);
      }

      if (orderBy === 'TO') {
        // For TO, lower is better
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [teams, order, orderBy]);

  const createSortHandler = (property) => () => {
    handleRequestSort(property);
  };

  const getColorForRank = (rank, total, category) => {
    const isTO = category === 'TO';
    const ratio = rank / (total - 1);

    // Define muted color ranges
    const goodColor = { r: 176, g: 196, b: 172 }; // Light Sage Green
    const badColor = { r: 233, g: 150, b: 122 };  // Muted Salmon Red

    let r, g, b;

    if (isTO) {
      // For TO, lower is better (reverse color scheme)
      r = Math.round(goodColor.r + (badColor.r - goodColor.r) * ratio);
      g = Math.round(goodColor.g + (badColor.g - goodColor.g) * ratio);
      b = Math.round(goodColor.b + (badColor.b - goodColor.b) * ratio);
    } else {
      r = Math.round(badColor.r + (goodColor.r - badColor.r) * ratio);
      g = Math.round(badColor.g + (goodColor.g - badColor.g) * ratio);
      b = Math.round(badColor.b + (goodColor.b - badColor.b) * ratio);
    }

    return `rgb(${r}, ${g}, ${b})`;
  };

  const rankedStats = useMemo(() => {
    const stats = {};
    statCategories.forEach(cat => {
      const values = teams.map(team => 
        cat === 'FG' || cat === 'FT'
          ? parseFloat(calculatePercentage(team.stats[cat], team.stats[cat + 'A']))
          : getLatestStat(team, cat)
      );
      const sorted = [...values].sort((a, b) => cat === 'TO' ? a - b : b - a);
      stats[cat] = values.map(value => sorted.indexOf(value));
    });
    return stats;
  }, [teams]);

  return (
    <div className="mt-8">
      <Typography variant="h5" gutterBottom>GM Total Stats</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>GM Name</TableCell>
              {statCategories.map(cat => (
                <TableCell key={cat}>
                  <TableSortLabel
                    active={orderBy === cat}
                    direction={orderBy === cat ? order : 'asc'}
                    onClick={createSortHandler(cat)}
                  >
                    {cat}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTeams.map((team, teamIndex) => (
              <TableRow key={team.name}>
                <TableCell>{team.name}</TableCell>
                {statCategories.map(cat => {
                  const value = cat === 'FG' || cat === 'FT' 
                    ? `${calculatePercentage(team.stats[cat], team.stats[cat + 'A'])}%`
                    : getLatestStat(team, cat).toFixed(1);
                  const rank = rankedStats[cat][teamIndex];
                  const backgroundColor = getColorForRank(rank, teams.length, cat);
                  return (
                    <TableCell 
                      key={cat} 
                      style={{ 
                        backgroundColor,
                        color: 'black' // Always use black text for better readability on these backgrounds
                      }}
                    >
                      {value}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default GMStatsTable;
