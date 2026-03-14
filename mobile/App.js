import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { AuthProvider } from './src/context/AuthContext';
import { GeofenceProvider } from './src/context/GeofenceContext';
import { LocationProvider } from './src/context/LocationContext';
import { NotificationProvider } from './src/context/NotificationContext';

import LoginScreen from './src/screens/auth/LoginScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import MapScreen from './src/screens/main/MapScreen';
import ZonesScreen from './src/screens/main/ZonesScreen';
import AlertsScreen from './src/screens/main/AlertsScreen';
import ZoneDetailsScreen from './src/screens/zone/ZoneDetailsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';

import { theme } from './src/styles/theme';
import GeofenceService from './src/services/geofencing/GeofenceService';

const Stack = createNativeStackNavigator();
const GEOFENCING_TASK = 'GEOFENCING_BACKGROUND_TASK';

// Configuration notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Tâche background
TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      await GeofenceService.checkLocation(location.coords);
    }
  }
});

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      // Permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();

      if (foregroundStatus === 'granted' && backgroundStatus === 'granted') {
        // Démarrer le tracking background
        await Location.startLocationUpdatesAsync(GEOFENCING_TASK, {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000,
          distanceInterval: 5,
          foregroundService: {
            notificationTitle: 'Geofencing Pro Actif',
            notificationBody: 'Surveillance des zones en cours...',
            notificationColor: '#2196F3',
          },
          activityType: Location.ActivityType.OtherNavigation,
          pausesUpdatesAutomatically: false,
        });
      }

      // Initialiser le service de geofencing
      await GeofenceService.initialize();
      
      setIsReady(true);
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  if (!isReady) {
    return null; // Ou un écran de chargement
  }

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <LocationProvider>
          <GeofenceProvider>
            <NotificationProvider>
              <NavigationContainer>
                <Stack.Navigator 
                  initialRouteName="Login"
                  screenOptions={{
                    headerStyle: { backgroundColor: theme.colors.primary },
                    headerTintColor: '#fff',
                  }}
                >
                  <Stack.Screen 
                    name="Login" 
                    component={LoginScreen} 
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="Home" 
                    component={HomeScreen}
                    options={{ title: 'Accueil' }}
                  />
                  <Stack.Screen 
                    name="Map" 
                    component={MapScreen}
                    options={{ title: 'Carte' }}
                  />
                  <Stack.Screen 
                    name="Zones" 
                    component={ZonesScreen}
                    options={{ title: 'Mes Zones' }}
                  />
                  <Stack.Screen 
                    name="Alerts" 
                    component={AlertsScreen}
                    options={{ title: 'Alertes' }}
                  />
                  <Stack.Screen 
                    name="ZoneDetails" 
                    component={ZoneDetailsScreen}
                    options={{ title: 'Détails Zone' }}
                  />
                  <Stack.Screen 
                    name="Settings" 
                    component={SettingsScreen}
                    options={{ title: 'Paramètres' }}
                  />
                </Stack.Navigator>
              </NavigationContainer>
              <StatusBar style="light" />
            </NotificationProvider>
          </GeofenceProvider>
        </LocationProvider>
      </AuthProvider>
    </PaperProvider>
  );
}