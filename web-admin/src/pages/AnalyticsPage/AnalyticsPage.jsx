import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Tabs, Tab } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import ActivityChart from '../../components/dashboard/ActivityChart/ActivityChart';

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <DatePicker
              label="Date de dÃ©but"
              value={startDate}
              onChange={setStartDate}
            />
          </Grid>
          <Grid item>
            <DatePicker
              label="Date de fin"
              value={endDate}
              onChange={setEndDate}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="ActivitÃ©" />
          <Tab label="Zones" />
          <Tab label="Devices" />
          <Tab label="Rapports" />
        </Tabs>

        <Box sx={{ p: 3, height: 400 }}>
          {activeTab === 0 && <ActivityChart />}
          {activeTab === 1 && <Typography>Statistiques par zone</Typography>}
          {activeTab === 2 && <Typography>Statistiques par device</Typography>}
          {activeTab === 3 && <Typography>GÃ©nÃ©ration de rapports</Typography>}
        </Box>
      </Paper>
    </Box>
  );
};

export default AnalyticsPage;
