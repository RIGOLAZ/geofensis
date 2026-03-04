import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Fab,
  Zoom,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  MyLocation as CenterIcon,
  BatteryFull as BatteryIcon,
  Smartphone as PhoneIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { db } from '../../config/firebase';
import { useGoogleMaps } from '../../context/GoogleMapsContext';

const LiveMap = () => {
  const { isLoaded, loadError, google, initMap } = useGoogleMaps();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const circlesRef = useRef([]);
  
  const [devices, setDevices] = useState([]);
  const [geofenceZones, setGeofenceZones] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 48.8566, lng: 2.3522 });

  // Chargement des devices (SANS orderBy pour éviter l'index)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'devices'), (snapshot) => {
      const devicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastSeenDate: doc.data().lastSeen?.toDate()
      }));
      
      // Trier côté client
      devicesData.sort((a, b) => (b.lastSeen?.seconds || 0) - (a.lastSeen?.seconds || 0));
      
      setDevices(devicesData);
      
      const activeDevice = devicesData.find(d => d.status === 'active' && d.location);
      if (activeDevice && !selectedDevice) {
        setMapCenter({
          lat: activeDevice.location.lat,
          lng: activeDevice.location.lng
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Chargement des zones
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'geofenceZones'), (snapshot) => {
      const zones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGeofenceZones(zones);
    });
    return () => unsubscribe();
  }, []);

  // Chargement des alertes (SANS orderBy pour éviter l'index)
  useEffect(() => {
    const q = query(
      collection(db, 'alerts'),
      where('status', '==', 'active'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestampDate: doc.data().timestamp?.toDate()
      }));
      
      // Trier côté client
      alertsData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      
      setAlerts(alertsData);
    });

    return () => unsubscribe();
  }, []);

  // Initialisation de la carte
  useEffect(() => {
    if (!isLoaded || !google || !mapRef.current) return;

    // Nettoyage
    Object.values(markersRef.current).forEach(m => m.setMap && m.setMap(null));
    circlesRef.current.forEach(c => c.setMap && c.setMap(null));
    markersRef.current = {};
    circlesRef.current = [];

    // Création de la carte
    mapInstanceRef.current = initMap(mapRef, {
      center: mapCenter,
      zoom: 14,
      mapTypeId: 'hybrid',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    if (!mapInstanceRef.current) return;

    // Ajout des zones geofencing
    geofenceZones.forEach(zone => {
      const circle = new google.maps.Circle({
        map: mapInstanceRef.current,
        center: { lat: zone.lat, lng: zone.lng },
        radius: zone.radius,
        fillColor: zone.type === 'safe' ? '#4caf50' : '#f44336',
        fillOpacity: 0.2,
        strokeColor: zone.type === 'safe' ? '#4caf50' : '#f44336',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding:8px"><b>${zone.name}</b><br/>Rayon: ${zone.radius}m</div>`
      });
      
      circle.addListener('click', () => {
        infoWindow.setPosition({ lat: zone.lat, lng: zone.lng });
        infoWindow.open(mapInstanceRef.current);
      });

      circlesRef.current.push(circle);
    });

    // Ajout des marqueurs devices
    devices.forEach(device => {
      if (!device.location) return;

      const position = {
        lat: device.location.lat,
        lng: device.location.lng
      };

      // Utilise l'ancienne API Marker (pas AdvancedMarkerElement)
      const marker = new google.maps.Marker({
        map: mapInstanceRef.current,
        position,
        title: device.name,
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(`
            <svg width="40" height="50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="${device.status === 'alert' ? '#f44336' : '#4caf50'}" stroke="white" stroke-width="3"/>
              <text x="20" y="26" text-anchor="middle" font-size="18">📱</text>
              <path d="M20 38 L15 45 L20 42 L25 45 Z" fill="${device.status === 'alert' ? '#f44336' : '#4caf50'}"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 45)
        },
        animation: device.status === 'alert' ? google.maps.Animation.BOUNCE : null
      });

      marker.addListener('click', () => {
        setSelectedDevice(device);
      });

      markersRef.current[device.id] = marker;
    });

    return () => {
      Object.values(markersRef.current).forEach(m => m.setMap && m.setMap(null));
      circlesRef.current.forEach(c => c.setMap && c.setMap(null));
    };
  }, [isLoaded, google, devices, geofenceZones, mapCenter]);

  const centerOnDevice = (device) => {
    if (!device.location || !mapInstanceRef.current) return;
    
    const newCenter = {
      lat: device.location.lat,
      lng: device.location.lng
    };
    
    mapInstanceRef.current.panTo(newCenter);
    mapInstanceRef.current.setZoom(16);
    setSelectedDevice(device);
  };

  const fitBounds = () => {
    if (!mapInstanceRef.current || devices.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    let hasLocation = false;
    
    devices.forEach(d => {
      if (d.location) {
        bounds.extend({ lat: d.location.lat, lng: d.location.lng });
        hasLocation = true;
      }
    });
    
    if (hasLocation) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'alert': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getBatteryColor = (level) => {
    if (!level) return 'default';
    if (level > 50) return 'success';
    if (level > 20) return 'warning';
    return 'error';
  };

  const formatLastSeen = (date) => {
    if (!date) return 'Jamais';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    return `${Math.floor(seconds / 3600)} h`;
  };

  if (loadError) {
    return <Alert severity="error">Erreur Google Maps: {loadError.message}</Alert>;
  }

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
      {/* Sidebar */}
      <Paper sx={{ width: 320, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon />
            Live Tracking
          </Typography>
          <Typography variant="body2">
            {devices.length} device{devices.length > 1 ? 's' : ''} • {alerts.length} alerte{alerts.length > 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Alertes */}
        {alerts.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'error.light' }}>
            <Typography variant="subtitle2" color="error.dark" sx={{ mb: 1, fontWeight: 'bold' }}>
              🚨 ALERTES ACTIVES
            </Typography>
            {alerts.slice(0, 3).map(alert => (
              <Paper key={alert.id} sx={{ p: 1, mb: 1, bgcolor: 'white' }}>
                <Typography variant="body2" noWrap>
                  <b>{alert.deviceName || alert.deviceId}</b>
                </Typography>
                <Typography variant="caption" color="error">
                  {alert.type === 'intrusion' ? '🔴 Intrusion' : '🆘 SOS'}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        <Divider />

        {/* Liste des devices */}
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {devices.map(device => (
            <ListItem
              key={device.id}
              button
              selected={selectedDevice?.id === device.id}
              onClick={() => centerOnDevice(device)}
              sx={{
                bgcolor: device.status === 'alert' ? 'error.light' : 'inherit',
                '&:hover': { bgcolor: device.status === 'alert' ? 'error.light' : 'action.hover' }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ 
                  bgcolor: device.status === 'alert' ? 'error.main' : 'success.main',
                  animation: device.status === 'alert' ? 'pulse 1s infinite' : 'none'
                }}>
                  <PhoneIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {device.name}
                    <Chip 
                      size="small" 
                      label={device.status?.toUpperCase()}
                      color={getStatusColor(device.status)}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                }
                secondary={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <BatteryIcon 
                      fontSize="small" 
                      color={getBatteryColor(device.batteryLevel)} 
                    />
                    <Typography component="span" variant="caption">
                      {device.batteryLevel || '--'}% • {formatLastSeen(device.lastSeenDate)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        {/* Légende */}
        <Box sx={{ p: 2, bgcolor: 'grey.100' }}>
          <Typography variant="caption" display="block" gutterBottom>
            Légende zones:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />
              <Typography variant="caption">Sécurisée</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
              <Typography variant="caption">Danger</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Carte */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {!isLoaded ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress />
            <Typography>Chargement de la carte...</Typography>
          </Box>
        ) : (
          <>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            
            {/* Boutons flottants */}
            <Zoom in={isLoaded}>
              <Box sx={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Fab color="primary" onClick={fitBounds} size="small">
                  <CenterIcon />
                </Fab>
                <Fab color="secondary" onClick={() => window.location.reload()} size="small">
                  <RefreshIcon />
                </Fab>
              </Box>
            </Zoom>

            {/* Info device sélectionné */}
            {selectedDevice && (
              <Paper sx={{ 
                position: 'absolute', 
                top: 20, 
                right: 20, 
                p: 2, 
                maxWidth: 300,
                zIndex: 1000
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6">{selectedDevice.name}</Typography>
                  <IconButton size="small" onClick={() => setSelectedDevice(null)}>×</IconButton>
                </Box>
                <Chip 
                  label={selectedDevice.status?.toUpperCase()}
                  color={getStatusColor(selectedDevice.status)}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" gutterBottom>
                  📍 {selectedDevice.location?.lat.toFixed(6)}, {selectedDevice.location?.lng.toFixed(6)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  🔋 Batterie: {selectedDevice.batteryLevel || 'N/A'}%
                </Typography>
                <Typography variant="body2" gutterBottom>
                  🎯 Zone: {selectedDevice.geofenceStatus?.inZone 
                    ? (selectedDevice.geofenceStatus?.zoneName || 'Sécurisée')
                    : 'HORS ZONE'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Dernière maj: {formatLastSeen(selectedDevice.lastSeenDate)}
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default LiveMap;