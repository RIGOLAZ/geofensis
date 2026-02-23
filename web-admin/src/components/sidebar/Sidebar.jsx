import React from 'react';
import { Drawer, List, ListItem, ListItemText, ListItemButton, Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dashboard, Map, Devices, Analytics, Settings } from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Zones', icon: <Map />, path: '/zones' },
  { text: 'Devices', icon: <Devices />, path: '/devices' },
  { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Geofencing Pro</Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <Box sx={{ mr: 2 }}>{item.icon}</Box>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
