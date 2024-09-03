import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import LandingPage from './components/LandingPage';
import Timer from './components/Timer';
import SerpentineDraftAnalyzer from './SerpantineDraft';
import FantasyBasketballDraftAnalyzer from './components/FantasyBasketballDraftAnalyzer';
import Sidebar from './components/Sidebar';
import NBASchedule from './components/NBASchedule';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#388e3c',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/serpentine-draft" element={<SerpentineDraftAnalyzer />} />
              <Route path="/auction-draft" element={<FantasyBasketballDraftAnalyzer />} />
              <Route path="/nba-schedule" element={<NBASchedule />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;