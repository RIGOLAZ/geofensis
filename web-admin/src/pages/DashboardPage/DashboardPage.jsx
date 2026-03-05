import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useGoogleMaps } from '../../context/GoogleMapsContext';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Fab,
  Zoom,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Devices as DevicesIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  BatteryFull as BatteryIcon,
  Smartphone as PhoneIcon,
  MyLocation as CenterIcon,
  Notifications as AlertIcon
} from '@mui/icons-material';

const DashboardPage = () => {
  const { isLoaded, loadError, google } = useGoogleMaps();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polygonsRef = useRef([]);
  
  const [devices, setDevices] = useState([]);
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Chargement devices
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'devices'), (snapshot) => {
      const devicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastSeenDate: doc.data().lastSeen?.toDate()
      }));
      devicesData.sort((a, b) => (b.lastSeen?.seconds || 0) - (a.lastSeen?.seconds || 0));
      setDevices(devicesData);
      
      if (!selectedDevice) {
        const active = devicesData.find(d => d.location && d.status === 'active');
        if (active) setSelectedDevice(active);
      }
    });
    return () => unsubscribe();
  }, []);

  // Chargement zones - CORRECTION: collection "zones" pas "geofenceZones"
  useEffect(() => {
    console.log('Chargement zones depuis collection "zones"...');
    
    const unsubscribe = onSnapshot(
      collection(db, 'zones'),
      (snapshot) => {
        console.log('Zones reçues:', snapshot.size);
        const zonesData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Zone brute:', doc.id, data);
          
          // CORRECTION: Structure de données avec coordinates array
          let lat, lng, radius;
          
          if (data.coordinates && Array.isArray(data.coordinates) && data.coordinates.length > 0) {
            // Premier point comme centre (ou calculer le centre du polygone)
            lat = data.coordinates[0].lat;
            lng = data.coordinates[0].lng;
          } else if (data.center) {
            lat = data.center.lat;
            lng = data.center.lng;
          } else if (data.lat && data.lng) {
            lat = data.lat;
            lng = data.lng;
          }
          
          // Calculer radius ou utiliser la surface
          radius = data.radius || data.surface || 500; // défaut 500m
          
          return {
            id: doc.id,
            name: data.name || 'Zone sans nom',
            type: data.type || 'safe', // 'safe' ou 'danger'
            alertLevel: data.alertLevel || 'low',
            lat,
            lng,
            radius,
            coordinates: data.coordinates || [], // Pour polygones
            active: data.active !== false, // true par défaut
            raw: data // Garder données brutes
          };
        }).filter(z => z.lat && z.lng); // Filtrer zones invalides
        
        console.log('Zones traitées:', zonesData);
        setZones(zonesData);
      },
      (err) => {
        console.error('ERREUR ZONES:', err);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Chargement alertes
  useEffect(() => {
    const q = query(collection(db, 'alerts'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestampDate: doc.data().timestamp?.toDate()
      }));
      alertsData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setAlerts(alertsData);
    });
    return () => unsubscribe();
  }, []);

  // Initialisation carte
  useEffect(() => {
    if (!isLoaded || !google || !mapRef.current || mapInitialized) return;
    
    const center = selectedDevice?.location 
      ? { lat: selectedDevice.location.lat, lng: selectedDevice.location.lng }
      : (zones[0] ? { lat: zones[0].lat, lng: zones[0].lng } : { lat: 48.8566, lng: 2.3522 });
    
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      mapTypeId: 'roadmap', // ou 'hybrid'
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMapInitialized(true);
    console.log('Carte initialisée');
  }, [isLoaded, google, selectedDevice, zones, mapInitialized]);

  // Affichage zones et devices
  useEffect(() => {
    if (!mapInstanceRef.current || !google) return;

    // Nettoyer
    polygonsRef.current.forEach(p => p.setMap && p.setMap(null));
    Object.values(markersRef.current).forEach(m => m.setMap && m.setMap(null));
    polygonsRef.current = [];
    markersRef.current = {};

    // Afficher zones (polygones ou cercles)
    zones.forEach(zone => {
      console.log('Affichage zone:', zone.name, zone.lat, zone.lng);
      
      let shape;
      
      // Si coordinates array avec plusieurs points = polygone
      if (zone.coordinates && zone.coordinates.length > 2) {
        const path = zone.coordinates.map(c => ({ lat: c.lat, lng: c.lng }));
        
        shape = new google.maps.Polygon({
          map: mapInstanceRef.current,
          paths: path,
          fillColor: zone.type === 'danger' ? '#f44336' : '#ff9800',
          fillOpacity: 0.25,
          strokeColor: zone.type === 'danger' ? '#f44336' : '#ff9800',
          strokeOpacity: 0.9,
          strokeWeight: 2,
        });
      } else {
        // Sinon = cercle
        shape = new google.maps.Circle({
          map: mapInstanceRef.current,
          center: { lat: zone.lat, lng: zone.lng },
          radius: zone.radius,
          fillColor: zone.type === 'danger' ? '#f44336' : '#ff9800',
          fillOpacity: 0.25,
          strokeColor: zone.type === 'danger' ? '#f44336' : '#ff9800',
          strokeOpacity: 0.9,
          strokeWeight: 2,
        });
      }

      // Label
      const label = new google.maps.Marker({
        position: { lat: zone.lat, lng: zone.lng },
        map: mapInstanceRef.current,
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(`
            <svg width="120" height="30" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="120" height="30" rx="5" fill="rgba(255,152,0,0.9)"/>
              <text x="60" y="20" text-anchor="middle" fill="white" font-size="12" font-family="Arial" font-weight="bold">
                ${zone.name}
              </text>
            </svg>
          `)}`,
          anchor: new google.maps.Point(60, 15)
        },
        clickable: false
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding:12px;">
            <h3 style="margin:0 0 8px 0; color:#ff9800">${zone.name}</h3>
            <p><b>Type:</b> ${zone.type === 'danger' ? '⚠️ Danger' : '🔒 Sécurisée'}</p>
            <p><b>Niveau:</b> ${zone.alertLevel}</p>
            <p><b>Centre:</b> ${zone.lat.toFixed(5)}, ${zone.lng.toFixed(5)}</p>
          </div>
        `
      });
      
      shape.addListener('click', () => {
        infoWindow.setPosition({ lat: zone.lat, lng: zone.lng });
        infoWindow.open(mapInstanceRef.current);
      });

      polygonsRef.current.push(shape, label);
    });

    // Afficher devices
    devices.forEach(device => {
      if (!device.location) return;
      
      const marker = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: { lat: device.location.lat, lng: device.location.lng },
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

      marker.addListener('click', () => setSelectedDevice(device));
      markersRef.current[device.id] = marker;
    });

  }, [zones, devices, google]);

  const centerOnDevice = (device) => {
    if (!device.location || !mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: device.location.lat, lng: device.location.lng });
    mapInstanceRef.current.setZoom(16);
    setSelectedDevice(device);
  };

  const fitBounds = () => {
    if (!mapInstanceRef.current) return;
    const bounds = new google.maps.LatLngBounds();
    let hasLoc = false;
    
    [...devices, ...zones].forEach(item => {
      if (item.location || (item.lat && item.lng)) {
        bounds.extend({ 
          lat: item.location?.lat || item.lat, 
          lng: item.location?.lng || item.lng 
        });
        hasLoc = true;
      }
    });
    
    if (hasLoc) mapInstanceRef.current.fitBounds(bounds);
  };

  const connectedDevices = devices.filter(d => {
    if (!d.lastSeenDate) return false;
    return (Date.now() - d.lastSeenDate) / 60000 < 5;
  }).length;

  const activeAlerts = alerts.filter(a => a.status === 'active').length;

  const getStatusColor = (status) => status === 'active' ? 'success' : status === 'alert' ? 'error' : 'default';
  const getBatteryColor = (level) => !level ? 'default' : level > 50 ? 'success' : level > 20 ? 'warning' : 'error';

  const formatLastSeen = (date) => {
    if (!date) return 'Jamais';
    const seconds = Math.floor((Date.now() - date) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    return `${Math.floor(seconds / 3600)} h`;
  };

  if (loadError) return <Alert severity="error">Erreur Google Maps: {loadError.message}</Alert>;

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)' }}>
      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}><DevicesIcon /></Avatar>
              <Box>
                <Typography color="textSecondary" variant="body2">Devices Connectés</Typography>
                <Typography variant="h4">{connectedDevices}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: activeAlerts > 0 ? 'error.main' : 'success.main' }}>
                <AlertIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" variant="body2">Alertes Actives</Typography>
                <Typography variant="h4" color={activeAlerts > 0 ? 'error' : 'inherit'}>
                  {activeAlerts}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}><LocationIcon /></Avatar>
              <Box>
                <Typography color="textSecondary" variant="body2">Zones Actives</Typography>
                <Typography variant="h4">{zones.length}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}><WarningIcon /></Avatar>
              <Box>
                <Typography color="textSecondary" variant="body2">En Alerte</Typography>
                <Typography variant="h4">{devices.filter(d => d.status === 'alert').length}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Map + Sidebar */}
      <Grid container spacing={3} sx={{ height: 'calc(100% - 140px)' }}>
        <Grid item xs={12} md={8} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            {!isLoaded ? (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                <Zoom in={isLoaded}>
                  <Box sx={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Fab color="primary" onClick={fitBounds} size="small"><CenterIcon /></Fab>
                  </Box>
                </Zoom>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            {activeAlerts > 0 && (
              <Box sx={{ p: 2, bgcolor: 'error.light' }}>
                <Typography variant="subtitle2" color="error.dark" sx={{ fontWeight: 'bold' }}>
                  🚨 ALERTES ({activeAlerts})
                </Typography>
              </Box>
            )}

            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Zones ({zones.length})</Typography>
              <List dense>
                {zones.map(zone => (
                  <ListItem key={zone.id} sx={{ bgcolor: 'action.hover', mb: 0.5, borderRadius: 1 }}>
                    <ListItemText
                      primary={zone.name}
                      secondary={`${zone.type === 'danger' ? '⚠️' : '🔒'} ${zone.alertLevel} • ${Math.round(zone.radius)}m`}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Devices ({devices.length})</Typography>
              <List dense>
                {devices.map(device => (
                  <ListItem
                    key={device.id}
                    button
                    selected={selectedDevice?.id === device.id}
                    onClick={() => centerOnDevice(device)}
                    sx={{ mb: 1, borderRadius: 2, bgcolor: device.status === 'alert' ? 'error.light' : 'background.paper' }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: device.status === 'alert' ? 'error.main' : 'success.main' }}>
                        <PhoneIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {device.name}
                          <Chip size="small" label={device.status} color={getStatusColor(device.status)} sx={{ height: 20 }} />
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BatteryIcon fontSize="small" color={getBatteryColor(device.batteryLevel)} />
                          {device.batteryLevel || '--'}% • {formatLastSeen(device.lastSeenDate)}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;