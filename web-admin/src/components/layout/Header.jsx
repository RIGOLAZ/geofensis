import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Avatar, Box } from '@mui/material';
import { Notifications as NotificationsIcon, Settings as SettingsIcon, Menu as MenuIcon } from '@mui/icons-material';

const Header = () => {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>Geofencing Pro</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Avatar sx={{ ml: 1, bgcolor: 'primary.main' }}>A</Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
