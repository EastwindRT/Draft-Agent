import { Link } from 'react-router-dom';
import { Box, Typography, Button, Container, Grid } from '@mui/material';

const LandingPage = () => {
  const getImagePath = () => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    return `${baseUrl}draftday.jpg`.replace('//', '/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${getImagePath()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#000', // Fallback color in case image doesn't load
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        color: '#fff', // White text color for visibility
        position: 'relative', // For debugging text
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ pt: 8, pb: 6 }}>
          <Typography
            component="h1"
            variant="h2"
            align="center"
            sx={{
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)', // Stronger shadow for better readability
            }}
            gutterBottom
          >
            The Draft Day
          </Typography>
          <Typography
            variant="h5"
            align="center"
            sx={{
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)', // Stronger shadow for better readability
              mb: 8, // Margin bottom to create space before buttons
            }}
            paragraph
          >
            Choose your draft style and start building your dream team!
          </Typography>
          <Box sx={{ mt: 8 }}> {/* Move buttons further down */}
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Button
                  component={Link}
                  to="/auction-draft"
                  variant="contained"
                  size="large"
                  sx={{
                    color: '#1976d2', // Text color of the button
                    backgroundColor: '#fff', // White button with blue text
                    '&:hover': {
                      backgroundColor: '#f5f5f5', // Slightly darker on hover
                    },
                  }}
                >
                  Auction Draft
                </Button>
              </Grid>
              <Grid item>
                <Button
                  component={Link}
                  to="/serpentine-draft"
                  variant="contained"
                  size="large"
                  sx={{
                    color: '#388e3c', // Text color of the button
                    backgroundColor: '#fff', // White button with green text
                    '&:hover': {
                      backgroundColor: '#f5f5f5', // Slightly darker on hover
                    },
                  }}
                >
                  Serpentine Draft
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* Debug information */}
      <Typography 
        variant="body2" 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          color: 'white', 
          bgcolor: 'rgba(0,0,0,0.5)',
          padding: '4px',
          zIndex: 3
        }}
      >
        Image path: {getImagePath()}
      </Typography>
    </Box>
  );
};

export default LandingPage;