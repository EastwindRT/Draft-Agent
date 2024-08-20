import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Box, Typography } from '@mui/material';

const DraftGraph = ({ teams }) => {
  const statCategories = ['PTS', 'TREB', 'AST', 'STL', 'BLK', 'TPM', 'TO', 'FG', 'FT'];

  const getLatestStat = (team, category) => {
    const statArray = team.stats[category];
    return statArray.length > 0 ? statArray[statArray.length - 1] : 0;
  };

  const calculatePercentage = (makes, attempts) => {
    const makesValue = makes.length > 0 ? makes[makes.length - 1] : 0;
    const attemptsValue = attempts.length > 0 ? attempts[attempts.length - 1] : 0;
    return attemptsValue > 0 ? (makesValue / attemptsValue * 100).toFixed(1) : 0;
  };

  const prepareData = () => {
    return statCategories.map(cat => {
      const categoryData = { category: cat };
      teams.forEach(team => {
        if (cat === 'FG' || cat === 'FT') {
          categoryData[team.name] = calculatePercentage(team.stats[cat], team.stats[cat + 'A']);
        } else {
          categoryData[team.name] = getLatestStat(team, cat);
        }
      });
      return categoryData;
    });
  };

  const data = prepareData();

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c',
    '#d0ed57', '#83a6ed', '#8dd1e1', '#82ca9d', '#f4a460'
  ];

  const renderTooltip = (props) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '5px', border: '1px solid #ccc' }}>
          <p>{`Category: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{color: entry.color}}>
              {`${entry.name}: ${entry.value}${label === 'FG' || label === 'FT' ? '%' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Team Performance Comparison</Typography>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip content={renderTooltip} />
          <Legend />
          {teams.map((team, index) => (
            <Bar 
              key={team.name} 
              dataKey={team.name} 
              fill={colors[index % colors.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default DraftGraph;