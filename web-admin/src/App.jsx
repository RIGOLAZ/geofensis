import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import frLocale from 'date-fns/locale/fr';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import ZonesListPage from './pages/ZonesPage/ZonesListPage/ZonesListPage';
import ZoneCreatePage from './pages/ZonesPage/ZoneCreatePage/ZoneCreatePage';
import ZoneEditPage from './pages/ZonesPage/ZoneEditPage/ZoneEditPage';
import DevicesListPage from './pages/DevicesPage/DevicesListPage';
import DeviceCreatePage from './pages/DevicesPage/DeviceCreatePage';
import DeviceDetailsPage from './pages/DevicesPage/DeviceDetailsPage';
import AnalyticsPage from './pages/AnalyticsPage/AnalyticsPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage/LoginPage';
import Layout from './components/layout/Layout';
 
const theme = createTheme({
  palette: {
    primary: { main: '#1976D2' },
    secondary: { main: '#FF4081' },
  },
});

// Composant de protection des routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* 👇 AJOUTEZ CE PROVIDER POUR LES DATE PICKERS */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="zones" element={<ZonesListPage />} />
            <Route path="zones/create" element={<ZoneCreatePage />} />
            <Route path="zones/edit/:id" element={<ZoneEditPage />} />
            <Route path="devices" element={<DevicesListPage />} />
            <Route path="devices/create" element={<DeviceCreatePage />} />
            <Route path="devices/:id" element={<DeviceDetailsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;