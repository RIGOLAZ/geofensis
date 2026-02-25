import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const RealTimeMap = ({ devices = [] }) => {
  return (
    <Paper sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
      <Box textAlign="center">
        <Typography variant="h6" color="textSecondary">
          Carte en temps réel
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {devices.length} device(s) connecté(s)
        </Typography>
        {devices.map(device => (
          <Typography key={device.id} variant="caption" display="block">
            {device.name || device.id}: {device.lat?.toFixed(4)}, {device.lng?.toFixed(4)}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
};

export default RealTimeMap;