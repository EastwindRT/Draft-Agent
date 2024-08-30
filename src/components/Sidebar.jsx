import { Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // New icon for NBA Schedule

const Sidebar = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
      }}
    >
      <List>
        <ListItem>
          <Typography variant="h6">Fantasy Draft Tools</Typography>
        </ListItem>
        <ListItem button component={Link} to="/">
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button component={Link} to="/timer">
          <ListItemIcon>
            <TimerIcon />
          </ListItemIcon>
          <ListItemText primary="Draft Timer" />
        </ListItem>
        <ListItem button component={Link} to="/serpentine-draft">
          <ListItemIcon>
            <TrendingUpIcon />
          </ListItemIcon>
          <ListItemText primary="Serpentine Draft" />
        </ListItem>
        <ListItem button component={Link} to="/auction-draft">
          <ListItemIcon>
            <MonetizationOnIcon />
          </ListItemIcon>
          <ListItemText primary="Auction Draft" />
        </ListItem>
        <ListItem button component={Link} to="/nba-schedule">
          <ListItemIcon>
            <CalendarTodayIcon />
          </ListItemIcon>
          <ListItemText primary="NBA Schedule" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;