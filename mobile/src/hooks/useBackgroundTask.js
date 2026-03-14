import { useEffect, useRef } from 'react';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import GeofenceService from '../services/geofencing/GeofenceService';

const GEOFENCING_TASK = 'GEOFENCING_BACKGROUND_TASK';

export const useBackgroundTask = () => {
  const isRegistered = useRef(false);

  useEffect(() => {
    defineTask();
    return () => {
      if (isRegistered.current) {
        Location.stopLocationUpdatesAsync(GEOFENCING_TASK);
      }
    };
  }, []);

  const defineTask = () => {
    TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
      if (error) {
        console.error(error);
        return;
      }
      if (data) {
        const { locations } = data;
        const location = locations[0];
        await GeofenceService.checkLocation(location.coords);
      }
    });
  };

  const startBackgroundTask = async () => {
    try {
      await Location.startLocationUpdatesAsync(GEOFENCING_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 5,
        foregroundService: {
          notificationTitle: 'Geofencing Pro',
          notificationBody: 'Surveillance en arrière-plan',
        },
      });
      isRegistered.current = true;
    } catch (error) {
      console.error('Failed to start background task:', error);
    }
  };

  const stopBackgroundTask = async () => {
    try {
      await Location.stopLocationUpdatesAsync(GEOFENCING_TASK);
      isRegistered.current = false;
    } catch (error) {
      console.error('Failed to stop background task:', error);
    }
  };

  return { startBackgroundTask, stopBackgroundTask };
};