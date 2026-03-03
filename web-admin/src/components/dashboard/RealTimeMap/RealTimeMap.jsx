import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { collection, onSnapshot } from 'firebase/firestore';
import { useGoogleMaps } from '../../../context/GoogleMapsContext';
import { db } from '../../../config/firebase';

const mapContainerStyle = {
  width: '100%',
  height: '380px'
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
  const zonesRef = useRef([]); // Pour stocker les zones affichées

  // Initialiser la carte
  useEffect(() => {
    if (!isLoaded || !google?.maps?.Map || !mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: center,
      zoom: 13,
      mapTypeId: 'roadmap',
      streetViewControl: false,
      fullscreenControl: false,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    });

    mapInstanceRef.current = map;

    // Charger et afficher les zones
    const unsubscribeZones = loadZones(map, google);

    return () => {
      unsubscribeZones();
      markersRef.current.forEach(marker => marker.map = null);
      zonesRef.current.forEach(zone => zone.setMap?.(null));
      mapInstanceRef.current = null;
    };
  }, [isLoaded, google]);

  // Charger les zones depuis Firestore
  const loadZones = (map, google) => {
    return onSnapshot(collection(db, 'zones'), (snapshot) => {
      // Supprimer anciennes zones
      zonesRef.current.forEach(zone => zone.setMap?.(null));
      zonesRef.current = [];

      snapshot.docs.forEach(doc => {
        const zone = { id: doc.id, ...doc.data() };
        displayZone(zone, map, google);
      });
    });
  };

  // Afficher une zone sur la carte
  const displayZone = (zone, map, google) => {
    const color = getAlertColor(zone.alertLevel);

    if (zone.type === 'circle' && zone.center && zone.radius) {
      const circle = new google.maps.Circle({
        map,
        center: zone.center,
        radius: zone.radius,
        fillColor: color,
        fillOpacity: 0.2,
        strokeColor: color,
        strokeWeight: 2,
      });
      zonesRef.current.push(circle);

      // Info window au clic
      circle.addListener('click', () => {
        showZoneInfo(zone, zone.center);
      });

    } else if (zone.type === 'polygon' && zone.coordinates?.length > 0) {
      const polygon = new google.maps.Polygon({
        map,
        paths: zone.coordinates,
        fillColor: color,
        fillOpacity: 0.2,
        strokeColor: color,
        strokeWeight: 2,
      });
      zonesRef.current.push(polygon);

      // Info window au clic (centre du polygone approximatif)
      const bounds = new google.maps.LatLngBounds();
      zone.coordinates.forEach(coord => bounds.extend(coord));
      const center = bounds.getCenter();
      
      polygon.addListener('click', () => {
        showZoneInfo(zone, { lat: center.lat(), lng: center.lng() });
      });
    }
  };

  // Afficher info de la zone
  const showZoneInfo = (zone, position) => {
    const content = `
      <div style="padding: 10px; max-width: 200px;">
        <h3 style="margin: 0 0 5px 0; color: ${getAlertColor(zone.alertLevel)};">${zone.name}</h3>
        <p style="margin: 0; font-size: 12px;">${zone.description || 'Pas de description'}</p>
        <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">
          Niveau: ${zone.alertLevel} | Type: ${zone.type}
        </p>
      </div>
    `;

    new google.maps.InfoWindow({
      content,
      position,
    }).open(mapInstanceRef.current);
  };

  const getAlertColor = (level) => {
    switch (level) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#2196f3';
    }
  };

  // Mettre à jour les positions des devices
  useEffect(() => {
    if (!mapInstanceRef.current || !google) return;

    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    devices.forEach(device => {
      if (device.lat && device.lng) {
        const marker = new google.maps.Marker({
          position: { lat: device.lat, lng: device.lng },
          map: mapInstanceRef.current,
          title: device.name || device.id,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#2196f3',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `<div><strong>${device.name || device.id}</strong><br/>${device.lat.toFixed(4)}, ${device.lng.toFixed(4)}</div>`
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
      }
    });
  }, [devices, google]);

  if (loadError) {
    return (
      <Box sx={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'error.light' }}>
        <Typography>Erreur: {loadError.message}</Typography>
      </Box>
    );
  }

  if (!isLoaded || !google?.maps?.Map) {
    return (
      <Box sx={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <div ref={mapRef} style={mapContainerStyle} />;
}

export default RealTimeMap;