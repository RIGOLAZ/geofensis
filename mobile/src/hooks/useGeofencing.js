import { useState, useEffect, useCallback } from 'react';
import { useGeofence } from '../context/GeofenceContext';
import { useLocation } from '../context/LocationContext';
import { isPointInZone, getDistanceToBoundary } from '../utils/geospatial/polygons';

export const useGeofencing = () => {
  const { zones, addAlert } = useGeofence();
  const { location } = useLocation();
  const [activeZones, setActiveZones] = useState([]);
  const [nearestZone, setNearestZone] = useState(null);

  useEffect(() => {
    if (!location) return;

    const checkZones = () => {
      const insideZones = [];
      let nearest = null;
      let minDistance = Infinity;

      zones.forEach(zone => {
        const isInside = isPointInZone(location.latitude, location.longitude, zone);
        
        if (isInside) {
          insideZones.push(zone);
        } else {
          const distance = getDistanceToBoundary(location, zone);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = { zone, distance };
          }
        }
      });

      setActiveZones(insideZones);
      setNearestZone(nearest);

      // Déclencher des alertes si nécessaire
      insideZones.forEach(zone => {
        if (!zone.lastAlert || Date.now() - zone.lastAlert > 60000) {
          addAlert({
            type: 'enter',
            zoneId: zone.id,
            zoneName: zone.name,
            timestamp: new Date()
          });
          zone.lastAlert = Date.now();
        }
      });
    };

    checkZones();
  }, [location, zones]);

  return {
    activeZones,
    nearestZone,
    isInDangerZone: activeZones.some(z => z.alertLevel === 'high')
  };
};