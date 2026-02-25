import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './Sidebar/Sidebar';
import Header from './Header/Header';

const Layout = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
