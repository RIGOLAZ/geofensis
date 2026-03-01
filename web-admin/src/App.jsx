import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage/LoginPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import ZonesListPage from './pages/ZonesPage/ZonesListPage/ZonesListPage';
import ZoneCreatePage from './pages/ZonesPage/ZoneCreatePage/ZoneCreatePage';
import ZoneEditPage from './pages/ZonesPage/ZoneEditPage/ZoneEditPage';
import DevicesListPage from './pages/DevicesPage/DevicesListPage';
import AnalyticsPage from './pages/AnalyticsPage/AnalyticsPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import { GoogleMapsProvider } from './context/GoogleMapsContext';

const theme = createTheme({
  palette: {
    primary: { main: '#1976D2' },
    secondary: { main: '#FF4081' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GoogleMapsProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="zones" element={<ZonesListPage />} />
              <Route path="zones/create" element={<ZoneCreatePage />} />
              <Route path="zones/edit/:id" element={<ZoneEditPage />} />
              <Route path="devices" element={<DevicesListPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Router>
      </GoogleMapsProvider>
    </ThemeProvider>
  );
}

export default App;