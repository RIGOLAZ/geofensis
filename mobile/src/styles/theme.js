import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976D2',
    accent: '#FF4081',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    error: '#D32F2F',
    warning: '#FFA000',
    success: '#388E3C',
    info: '#1976D2',
    // Couleurs spécifiques geofencing
    zoneSafe: 'rgba(76, 175, 80, 0.3)',
    zoneWarning: 'rgba(255, 152, 0, 0.3)',
    zoneDanger: 'rgba(244, 67, 54, 0.3)',
    zoneBorder: '#1976D2',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: { fontFamily: 'Roboto-Regular' },
    medium: { fontFamily: 'Roboto-Medium' },
    bold: { fontFamily: 'Roboto-Bold' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};