import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, Polygon, InfoWindow } from '@react-google-maps/api';
import { Box, Chip, Typography, Paper } from '@mui/material';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 48.8566,
  lng: 2.3522,
};

const RealTimeMap = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['geometry'],
  });

  const [zones, setZones] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    // Ã‰couter les zones
    const zonesUnsubscribe = onSnapshot(collection(db, 'zones'), (snapshot) => {
      const zonesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setZones(zonesData);
    });

    // Ã‰couter les devices
    const devicesUnsubscribe = onSnapshot(collection(db, 'devices'), (snapshot) => {
      const devicesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDevices(devicesData);
    });

    return () => {
      zonesUnsubscribe();
      devicesUnsubscribe();
    };
  }, []);

  const getZoneColor = (alertLevel) => {
    switch (alertLevel) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      default:
        return '#4CAF50';
    }
  };

  const onMapLoad = useCallback((map) => {
    // Ajuster la vue pour voir tous les Ã©lÃ©ments
    const bounds = new window.google.maps.LatLngBounds();
    
    zones.forEach((zone) => {
      if (zone.type === 'circle') {
        bounds.extend(new window.google.maps.LatLng(zone.center.lat, zone.center.lng));
      } else if (zone.coordinates) {
        zone.coordinates.forEach((coord) => {
          bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        });
      }
    });

    devices.forEach((device) => {
      if (device.lastLocation) {
        bounds.extend(
          new window.google.maps.LatLng(
            device.lastLocation.latitude,
            device.lastLocation.longitude
          )
        );
      }
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
  }, [zones, devices]);

  if (!isLoaded) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Typography>Chargement de la carte...</Typography></Box>;
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={10}
      onLoad={onMapLoad}
      options={{
        mapTypeId: 'hybrid',
        fullscreenControl: true,
        streetViewControl: false,
      }}
    >
      {/* Affichage des zones */}
      {zones.map((zone) => {
        const color = getZoneColor(zone.alertLevel);
        
        if (zone.type === 'circle') {
          return (
            <Circle
              key={zone.id}
              center={{ lat: zone.center.lat, lng: zone.center.lng }}
              radius={zone.radius}
              options={{
                fillColor: color,
                fillOpacity: 0.3,
                strokeColor: color,
                strokeOpacity: 1,
                strokeWeight: 2,
              }}
            />
          );
        }
        
        return (
          <Polygon
            key={zone.id}
            paths={zone.coordinates.map((c) => ({ lat: c.lat, lng: c.lng }))}
            options={{
              fillColor: color,
              fillOpacity: 0.3,
              strokeColor: color,
              strokeOpacity: 1,
              strokeWeight: 2,
            }}
          />
        );
      })}

      {/* Affichage des devices */}
      {devices.map((device) => {
        if (!device.lastLocation) return null;
        
        const isInZone = zones.some((zone) => {
          // Simplification - vÃ©rification basique
          return false; // Ã€ implÃ©menter avec la vraie logique
        });

        return (
          <Marker
            key={device.id}
            position={{
              lat: device.lastLocation.latitude,
              lng: device.lastLocation.longitude,
            }}
            icon={{
              url: isInZone 
                ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            onClick={() => setSelectedMarker(device)}
          />
        );
      })}

      {selectedMarker && (
        <InfoWindow
          position={{
            lat: selectedMarker.lastLocation.latitude,
            lng: selectedMarker.lastLocation.longitude,
          }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <Paper sx={{ p: 1, maxWidth: 200 }}>
            <Typography variant="subtitle2">{selectedMarker.id}</Typography>
            <Typography variant="body2" color="textSecondary">
              DerniÃ¨re mise Ã  jour: {selectedMarker.lastUpdate?.toDate?.().toLocaleString() || 'Inconnue'}
            </Typography>
            <Chip 
              size="small" 
              label={selectedMarker.online ? 'En ligne' : 'Hors ligne'}
              color={selectedMarker.online ? 'success' : 'error'}
              sx={{ mt: 1 }}
            />
          </Paper>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default RealTimeMap;
