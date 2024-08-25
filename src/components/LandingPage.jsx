import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Container, Grid } from '@mui/material';

const LandingPage = () => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Container maxWidth="lg">
        <Box sx={{ pt: 8, pb: 6 }}>
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="text.primary"
            gutterBottom
          >
            The Draft Day
          </Typography>
          <Typography variant="h5" align="center" color="text.secondary" paragraph>
            Choose your draft style and start building your dream team!
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Button
                  component={Link}
                  to="/auction-draft"
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#115293' },
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
                    backgroundColor: '#388e3c',
                    '&:hover': { backgroundColor: '#2e7d32' },
                  }}
                >
                  Serpentine Draft
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;