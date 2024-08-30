import { useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography 
} from '@mui/material';

const scheduleData = {
  "Atlanta Hawks": "3443346243334344344334482",
  "Boston Celtics": "3443336244334434434334482",
  "Brooklyn Nets": "3434345243443334435343482",
  "Charlotte Hornets": "3343346233424444443434482",
  "Chicago Bulls": "3344436233443434424434482",
  "Cleveland Cavaliers": "3444336224334435343443482",
  "Dallas Mavericks": "2444345243434435344244382",
  "Denver Nuggets": "2442336244443444434434382",
  "Detroit Pistons": "3444345233433444443433482",
  "Golden State Warriors": "3342436244334345343434482",
  "Houston Rockets": "3344435243343354344434382",
  "Indiana Pacers": "3343446243432244434444482",
  "Los Angeles Clippers": "3344445224343433444434482",
  "Los Angeles Lakers": "3343346234343434434344482",
  "Memphis Grizzlies": "3443346243334335344334482",
  "Miami Heat": "2343246243443335444434482",
  "Milwaukee Bucks": "3343426233443445344343482",
  "Minnesota Timberwolves": "3344236243443445443333482",
  "New Orleans Pelicans": "3434346324434335442433482",
  "New York Knicks": "2344346244433335333444482",
  "Oklahoma City Thunder": "3344245244343245444334482",
  "Orlando Magic": "3443446243433345324343482",
  "Philadelphia 76ers": "3243426234443444344443482",
  "Phoenix Suns": "3344236242533445434343482",
  "Portland Trail Blazers": "3443345233444344443434382",
  "Sacramento Kings": "2444346324333344343444482",
  "San Antonio Spurs": "2444336243342345434443482",
  "Toronto Raptors": "3443346233433444434344382",
  "Utah Jazz": "2434345234424444444434382",
  "Washington Wizards": "2334336234443444335344482"
};

const teamColors = {
  "Atlanta Hawks": "#E03A3E",
  "Boston Celtics": "#007A33",
  "Brooklyn Nets": "#000000",
  "Charlotte Hornets": "#1D1160",
  "Chicago Bulls": "#CE1141",
  "Cleveland Cavaliers": "#860038",
  "Dallas Mavericks": "#00538C",
  "Denver Nuggets": "#0E2240",
  "Detroit Pistons": "#C8102E",
  "Golden State Warriors": "#1D428A",
  "Houston Rockets": "#CE1141",
  "Indiana Pacers": "#002D62",
  "Los Angeles Clippers": "#C8102E",
  "Los Angeles Lakers": "#552583",
  "Memphis Grizzlies": "#5D76A9",
  "Miami Heat": "#98002E",
  "Milwaukee Bucks": "#00471B",
  "Minnesota Timberwolves": "#0C2340",
  "New Orleans Pelicans": "#0C2340",
  "New York Knicks": "#006BB6",
  "Oklahoma City Thunder": "#007AC1",
  "Orlando Magic": "#0077C0",
  "Philadelphia 76ers": "#006BB6",
  "Phoenix Suns": "#1D1160",
  "Portland Trail Blazers": "#E03A3E",
  "Sacramento Kings": "#5A2D81",
  "San Antonio Spurs": "#C4CED4",
  "Toronto Raptors": "#CE1141",
  "Utah Jazz": "#002B5C",
  "Washington Wizards": "#002B5C"
};

const NBAScheduleGrid = () => {
  const processedSchedule = useMemo(() => {
    const weeklyGames = Array(23).fill().map(() => []);
    Object.values(scheduleData).forEach(schedule => {
      schedule.slice(0, 23).split('').forEach((games, week) => {
        weeklyGames[week].push(parseInt(games, 10));
      });
    });
    return weeklyGames;
  }, []);

  const getColorForGames = (games, weekGames) => {
    const min = Math.min(...weekGames);
    const max = Math.max(...weekGames);
    const range = max - min;
    const normalizedValue = (games - min) / range;

    const lowColor = [220, 120, 120];  // Muted red
    const midColor = [200, 200, 160];  // Light olive
    const highColor = [120, 180, 120]; // Muted green

    let r, g, b;
    if (normalizedValue < 0.5) {
      const t = normalizedValue * 2;
      r = Math.round(lowColor[0] + t * (midColor[0] - lowColor[0]));
      g = Math.round(lowColor[1] + t * (midColor[1] - lowColor[1]));
      b = Math.round(lowColor[2] + t * (midColor[2] - lowColor[2]));
    } else {
      const t = (normalizedValue - 0.5) * 2;
      r = Math.round(midColor[0] + t * (highColor[0] - midColor[0]));
      g = Math.round(midColor[1] + t * (highColor[1] - midColor[1]));
      b = Math.round(midColor[2] + t * (highColor[2] - midColor[2]));
    }

    return `rgb(${r}, ${g}, ${b})`;
  };

  const getTextColor = (backgroundColor) => {
    const rgb = backgroundColor.match(/\d+/g).map(Number);
    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const renderSchedule = () => {
    return Object.entries(scheduleData).map(([team, schedule]) => (
      <TableRow key={team}>
        <TableCell 
          component="th" 
          scope="row" 
          style={{ 
            position: 'sticky', 
            left: 0, 
            background: `${teamColors[team]}20`, // 20 is hex for 12% opacity
            zIndex: 1,
            color: teamColors[team],
            fontWeight: 'bold'
          }}
        >
          {team}
        </TableCell>
        {schedule.slice(0, 23).split('').map((games, week) => {
          const backgroundColor = getColorForGames(parseInt(games, 10), processedSchedule[week]);
          const textColor = getTextColor(backgroundColor);
          return (
            <TableCell 
              key={week} 
              align="center"
              style={{
                backgroundColor,
                color: textColor,
                fontWeight: 'bold',
                border: '1px solid #ddd'
              }}
            >
              {games}
            </TableCell>
          );
        })}
      </TableRow>
    ));
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        NBA Team Schedule Grid (23 Weeks)
      </Typography>
      <TableContainer component={Paper} style={{ maxHeight: '80vh', overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ position: 'sticky', left: 0, zIndex: 2, background: '#fff' }}>Team</TableCell>
              {Array.from({ length: 23 }, (_, i) => (
                <TableCell key={i} align="center" style={{ minWidth: 50, fontWeight: 'bold' }}>{i + 1}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {renderSchedule()}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default NBAScheduleGrid;