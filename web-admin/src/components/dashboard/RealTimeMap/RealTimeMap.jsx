import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useGoogleMaps } from '../../../context/GoogleMapsContext';

const mapContainerStyle = {
  width: '100%',
  height: '350px'
};

const center = {
  lat: 48.8566,
  lng: 2.3522
};

function RealTimeMap({ devices = [] }) {
  // Remplacez useJsApiLoader par le contexte
  const { isLoaded, loadError } = useGoogleMaps();

  const onLoad = useCallback((map) => {
    console.log('RealTimeMap loaded');
    
    // Ajuster la vue si des devices sont présents
    if (devices.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidPosition = false;
      
      devices.forEach(device => {
        if (device.lat && device.lng) {
          bounds.extend({ lat: device.lat, lng: device.lng });
          hasValidPosition = true;
        }
      });
      
      if (hasValidPosition) {
        map.fitBounds(bounds);
        // Zoom out un peu si un seul device
        if (devices.length === 1) {
          map.setZoom(15);
        }
      }
    }
  }, [devices]);

  if (loadError) {
    return (
      <Box sx={{ 
        height: 350, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'error.light',
        color: 'error.contrastText',
        borderRadius: 1
      }}>
        <Typography>Erreur chargement carte: {loadError.message}</Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{ 
        height: 350, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2
      }}>
        <CircularProgress size={24} />
        <Typography color="textSecondary">Chargement de la carte...</Typography>
      </Box>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
      onLoad={onLoad}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {devices.map((device) => (
        <Marker
          key={device.id}
          position={{ 
            lat: device.lat || center.lat, 
            lng: device.lng || center.lng 
          }}
          title={device.name || device.id}
          animation={window.google.maps.Animation.DROP}
        />
      ))}
    </GoogleMap>
  );
}

export default React.memo(RealTimeMap);