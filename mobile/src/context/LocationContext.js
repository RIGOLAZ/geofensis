import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LocationContext = createContext({});

const LOCATION_TASK_NAME = 'background-location-task';

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission de localisation refusée');
        return;
      }

      let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        setErrorMsg('Permission de localisation en arrière-plan refusée');
      }
    })();
  }, []);

  const startTracking = async () => {
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 5,
        foregroundService: {
          notificationTitle: 'Geofencing Pro',
          notificationBody: 'Suivi de localisation actif',
        },
      });
      setTracking(true);
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const stopTracking = async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      setTracking(false);
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      setLocation(location.coords);
      return location.coords;
    } catch (error) {
      setErrorMsg(error.message);
      return null;
    }
  };

  return (
    <LocationContext.Provider value={{
      location,
      errorMsg,
      tracking,
      startTracking,
      stopTracking,
      getCurrentLocation
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);