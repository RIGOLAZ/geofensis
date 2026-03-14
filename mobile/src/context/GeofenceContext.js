import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import GeofenceService from '../services/geofencing/GeofenceService';

const GeofenceContext = createContext({});

export const GeofenceProvider = ({ children }) => {
  const [zones, setZones] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'zones'),
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const zonesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setZones(zonesData);
      
      // Mettre à jour le service de geofencing
      zonesData.forEach(zone => {
        GeofenceService.addZone(zone);
      });
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
      GeofenceService.cleanup();
    };
  }, []);

  const checkZoneStatus = (location, zone) => {
    const { isPointInZone } = require('../utils/geospatial/polygons');
    return isPointInZone(location.latitude, location.longitude, zone);
  };

  const addAlert = (alert) => {
    setActiveAlerts(prev => [...prev, { ...alert, id: Date.now() }]);
  };

  const clearAlert = (alertId) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getZoneById = (id) => zones.find(z => z.id === id);

  return (
    <GeofenceContext.Provider value={{
      zones,
      activeAlerts,
      loading,
      checkZoneStatus,
      addAlert,
      clearAlert
    }}>
      {children}
    </GeofenceContext.Provider>
  );
};

export const useGeofence = () => useContext(GeofenceContext);