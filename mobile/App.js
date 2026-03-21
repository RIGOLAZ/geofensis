import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { View, ActivityIndicator, Alert, Platform } from 'react-native'; // Importez ActivityIndicator et Alert

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

// Configuration notifications (peut rester en dehors)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Tâche background (peut rester en dehors)
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
  const [initializationError, setInitializationError] = useState(null); // Nouvel état pour l'erreur

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      console.log('Starting app initialization...');

      // --- 1. Demander les permissions ---
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();

      console.log(`Permissions - Foreground: ${foregroundStatus}, Background: ${backgroundStatus}, Notifications: ${notifStatus}`);

      // --- 2. Démarrer le tracking background (si les permissions sont accordées) ---
      if (foregroundStatus === 'granted' && backgroundStatus === 'granted') {
        try {
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
            // IMPORTANT POUR ANDROID: Pour que la tâche survive au redémarrage
            showsBackgroundLocationIndicator: true,
          });
          console.log('Background location updates started successfully.');
        } catch (locationError) {
          // Ne pas bloquer toute l'init si le tracking background échoue
          console.error('Failed to start background location updates:', locationError);
          // Vous pouvez décider de quand même continuer ou d'afficher une alerte
        }
      } else {
        console.warn('Location permissions not fully granted. Background tracking will not start.');
        // Optionnel : informer l'utilisateur que les fonctionnalités seront limitées
      }

      // --- 3. Initialiser le service de geofencing ---
      try {
        await GeofenceService.initialize();
        console.log('GeofenceService initialized successfully.');
      } catch (geofenceError) {
        console.error('Failed to initialize GeofenceService:', geofenceError);
        // Ne pas bloquer, mais peut-être définir une erreur spécifique
      }

      // --- 4. Si tout s'est bien passé (ou même si certaines étapes non-critiques ont échoué) ---
      setIsReady(true);
      console.log('App initialization completed.');

    } catch (error) {
      // Cette erreur est FATALE - quelque chose de majeur a échoué
      console.error('FATAL: App initialization crashed:', error);
      setInitializationError(error.message || 'Une erreur fatale est survenue lors du démarrage.');
      // Ne pas passer setIsReady à true
    }
  }

  // --- GESTION DES ÉTATS D'AFFICHAGE ---

  // 1. Erreur fatale
  if (initializationError) {
    // Afficher un écran d'erreur et proposer de réessayer
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <StatusBar style="dark" />
        {/* Vous pouvez importer un composant d'erreur plus joli */}
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Alert
          title="Erreur de démarrage"
          message={initializationError}
          buttons={[
            { text: "Réessayer", onPress: () => {
                setIsReady(false);
                setInitializationError(null);
                initializeApp();
              }
            }
          ]}
        />
        // Note: Alert ne s'affiche pas toujours pendant le chargement. 
        // Pour un test rapide, vous pouvez logger l'erreur et retourner une View simple.
        // Retournons une vue simple pour l'instant.
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <StatusBar style="auto" />
            <ActivityIndicator size="large" color="#2196F3" />
            <Text>Erreur : {initializationError}</Text>
          </View>
        );
      </View>
    );
  }

  // 2. Chargement initial
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        {/* Vous pouvez ajouter un logo ou un message ici */}
      </View>
    );
  }

  // 3. Application prête - ON REND TOUT
  console.log('Rendering main application...');
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