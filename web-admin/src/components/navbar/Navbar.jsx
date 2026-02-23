import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Geofencing Pro
        </Typography>
        <Box>
          <Button color="inherit" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => navigate('/zones')}>
            Zones
          </Button>
          <Button color="inherit" onClick={() => navigate('/devices')}>
            Devices
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
