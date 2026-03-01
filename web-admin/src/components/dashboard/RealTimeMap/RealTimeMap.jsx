import React, { useEffect, useRef, useState } from 'react';
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
  const { isLoaded, loadError, google } = useGoogleMaps();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Vérifier que tout est prêt
    if (!isLoaded || !google || !google.maps || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: center,
        zoom: 13,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;
    } catch (error) {
      console.error('Erreur création carte:', error);
    }

    return () => {
      // Cleanup
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) marker.setMap(null);
      });
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [isLoaded, google]); // Dépendances importantes

  // Mettre à jour les markers quand devices change
  useEffect(() => {
    if (!mapInstanceRef.current || !google || !google.maps) return;

    // Supprimer anciens markers
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) marker.setMap(null);
    });
    markersRef.current = [];

    if (devices.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidPosition = false;

    devices.forEach(device => {
      if (device.lat && device.lng && google.maps.Marker) {
        const position = { lat: device.lat, lng: device.lng };
        
        const marker = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: device.name || device.id,
          animation: google.maps.Animation?.DROP,
        });

        // Info window
        const infoWindow = new google.maps.InfoWindow({
          content: `<div><strong>${device.name || device.id}</strong><br/>Lat: ${device.lat.toFixed(4)}<br/>Lng: ${device.lng.toFixed(4)}</div>`
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
        hasValidPosition = true;
      }
    });

    if (hasValidPosition && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds);
      if (devices.length === 1) {
        mapInstanceRef.current.setZoom(15);
      }
    }
  }, [devices, google]);

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
        <Typography>Erreur: {loadError.message}</Typography>
      </Box>
    );
  }

  if (!isLoaded || !google || !google.maps) {
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
    <div ref={mapRef} style={mapContainerStyle} />
  );
}

export default React.memo(RealTimeMap);