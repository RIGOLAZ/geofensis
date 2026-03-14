// DashboardPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Badge,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  Devices as DevicesIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  BatteryFull as BatteryIcon,
  Smartphone as PhoneIcon,
  CheckCircle as CheckIcon,
  SmartButton
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  
  // ✅ Création du ref AVANT tout
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polygonsRef = useRef([]);
  
  const [devices, setDevices] = useState([]);
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [violatedZones, setViolatedZones] = useState(new Set()); // 🆕 AJOUTER CECI
  const [stats, setStats] = useState({
    totalZones: 0,
    connectedDevices: 0,
    activeAlerts: 0,
    violations: 0
  });

  // Stats calculées
  useEffect(() => {
    const connected = devices.filter(d => {
      if (!d.lastSeenDate) return false;
      return (Date.now() - d.lastSeenDate) / 60000 < 5;
    }).length;

    setStats({
      totalZones: zones.length,
      connectedDevices: connected,
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      violations: devices.filter(d => d.status === 'alert').length
    });
  }, [devices, alerts, zones]);

  // Chargement données Firestore
  useEffect(() => {
    const unsubDevices = onSnapshot(collection(db, 'devices'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastSeenDate: doc.data().lastSeen?.toDate()
      })).sort((a, b) => (b.lastSeen?.seconds || 0) - (a.lastSeen?.seconds || 0));
      setDevices(data);
    });

    const unsubZones = onSnapshot(collection(db, 'zones'), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        let lat, lng;
        
        if (d.coordinates?.length > 0) {
          lat = d.coordinates[0].lat;
          lng = d.coordinates[0].lng;
        } else if (d.center) {
          lat = d.center.lat;
          lng = d.center.lng;
        }
        
        return {
          id: doc.id,
          name: d.name || 'Zone sans nom',
          type: d.type || 'safe',
          lat,
          lng,
          radius: d.radius || d.surface || 500,
          coordinates: d.coordinates || []
        };
      }).filter(z => z.lat && z.lng);
      
      setZones(data);
    });

    const unsubAlerts = onSnapshot(
      query(collection(db, 'alerts'), where('status', '==', 'active')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setAlerts(data);
      }
    );

    return () => {
      unsubDevices();
      unsubZones();
      unsubAlerts();
    };
  }, []);

  // ✅ Initialisation carte - ATTENDRE que le DOM soit prêt
  useEffect(() => {
    // Vérifier que Google Maps est chargé ET que le conteneur existe
    if (!window.google?.maps?.Map || !mapContainerRef.current) {
      console.log('⏳ Attente...', {
        hasGoogle: !!window.google?.maps?.Map,
        hasContainer: !!mapContainerRef.current
      });
      return;
    }

    // Éviter double initialisation
    if (mapInstanceRef.current) return;

    console.log('✅ Initialisation carte');

    try {
      const center = zones[0] 
        ? { lat: zones[0].lat, lng: zones[0].lng }
        : { lat: 48.8566, lng: 2.3522 };

      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 13,
        mapTypeId: 'roadmap',
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMapReady(true);
      setMapError(null);
      console.log('✅ Carte initialisée');
    } catch (err) {
      console.error('❌ Erreur init carte:', err);
      setMapError(err.message);
    }

    // Cleanup
    return () => {
      // Ne pas détruire la carte, juste nettoyer les listeners si besoin
    };
  }, [zones]); // Dépend de zones pour avoir le centre initial

  // Affichage zones et devices sur la carte
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) {
      console.log('⏳ Carte pas prête pour marqueurs');
      return;
    }

    console.log('🎨 Mise à jour marqueurs:', zones.length, 'zones,', devices.length, 'devices');

    // Nettoyer anciens éléments
    polygonsRef.current.forEach(p => p.setMap?.(null));
    Object.values(markersRef.current).forEach(m => m.setMap?.(null));
    polygonsRef.current = [];
    markersRef.current = {};

        // Dessiner zones avec couleur dynamique selon les violations
    zones.forEach(zone => {
      try {
        const isViolated = violatedZones.has(zone.id); // 🆕 Vérifier si violée
        
        // 🎨 Couleur dynamique : rouge si violée, sinon selon le type
        const fillColor = isViolated ? '#f44336' : 
                         zone.type === 'danger' ? '#ff9800' : '#4caf50';
        const strokeColor = isViolated ? '#d32f2f' : 
                           zone.type === 'danger' ? '#ff9800' : '#4caf50';
        
        let shape;
        
        if (zone.coordinates?.length > 2) {
          shape = new window.google.maps.Polygon({
            map: mapInstanceRef.current,
            paths: zone.coordinates.map(c => ({ lat: c.lat, lng: c.lng })),
            fillColor: fillColor,        // 🆕 Variable dynamique
            fillOpacity: isViolated ? 0.5 : 0.25,  // 🆕 Plus opaque si violée
            strokeColor: strokeColor,    // 🆕 Variable dynamique
            strokeWeight: isViolated ? 4 : 2,      // 🆕 Plus épais si violée
          });
        } else {
          shape = new window.google.maps.Circle({
            map: mapInstanceRef.current,
            center: { lat: zone.lat, lng: zone.lng },
            radius: zone.radius,
            fillColor: fillColor,        // 🆕 Variable dynamique
            fillOpacity: isViolated ? 0.5 : 0.25,  // 🆕 Plus opaque si violée
            strokeColor: strokeColor,    // 🆕 Variable dynamique
            strokeWeight: isViolated ? 4 : 2,      // 🆕 Plus épais si violée
          });
        }

        // Label avec indication de violation
        const label = new window.google.maps.Marker({
          position: { lat: zone.lat, lng: zone.lng },
          map: mapInstanceRef.current,
          icon: {
            url: `data:image/svg+xml,${encodeURIComponent(`
              <svg width="120" height="30" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="120" height="30" rx="4" fill="${isViolated ? '#d32f2f' : 'rgba(0,0,0,0.7)'}"/>
                <text x="60" y="20" text-anchor="middle" fill="white" font-size="12" font-family="Arial" font-weight="bold">
                  ${isViolated ? '🚨 ' : ''}${zone.name}
                </text>
              </svg>
            `)}`,
            anchor: new window.google.maps.Point(60, 15)
          },
          clickable: false
        });

        polygonsRef.current.push(shape, label);
      } catch (err) {
        console.error('Erreur zone:', err);
      }
    });

    // Dessiner devices
    devices.forEach(device => {
      if (!device.location) return;
      
      try {
        const marker = new window.google.maps.Marker({
          map: mapInstanceRef.current,
          position: { lat: device.location.lat, lng: device.location.lng },
          title: device.name,
          icon: {
            url: `data:image/svg+xml,${encodeURIComponent(`
              <svg width="36" height="45" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="16" fill="${device.status === 'alert' ? '#f44336' : '#4caf50'}" stroke="white" stroke-width="2"/>
                <text x="18" y="23" text-anchor="middle" font-size="14">📱</text>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(36, 45),
            anchor: new window.google.maps.Point(18, 40)
          }
        });

        marker.addListener('click', () => setSelectedDevice(device));
        markersRef.current[device.id] = marker;
      } catch (err) {
        console.error('Erreur marker:', err);
      }
    });

  }, [mapReady, zones, devices, violatedZones]); // 🆕 Ajouter violatedZones

    // 🆕 Fonction pour mettre à jour les zones violées (appelée par le hook useGeofencing)
  const updateViolatedZones = useCallback((zoneId, isViolated) => {
    setViolatedZones(prev => {
      const newSet = new Set(prev);
      if (isViolated) {
        newSet.add(zoneId);
      } else {
        newSet.delete(zoneId);
      }
      return newSet;
    });
  }, []);

  const centerOnDevice = (device) => {
    if (!device.location || !mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: device.location.lat, lng: device.location.lng });
    mapInstanceRef.current.setZoom(16);
    setSelectedDevice(device);
  };

  const getStatusColor = (status) => 
    status === 'active' ? 'success' : status === 'alert' ? 'error' : 'default';

  const formatLastSeen = (date) => {
    if (!date) return 'Jamais';
    const seconds = Math.floor((Date.now() - date) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    return `${Math.floor(seconds / 3600)} h`;
  };

  // Affichage erreur API Google Maps
  if (mapError?.includes('ApiNotActivatedMapError')) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        <Typography variant="h6">API Google Maps non activée</Typography>
        <Typography>
          1. Va sur <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">Google Cloud Console</a><br/>
          2. Active "Maps JavaScript API"<br/>
          3. Vérifie ta clé API
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">Tableau de Bord</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={currentUser?.photoURL} sx={{ width: 40, height: 40 }}>
            {currentUser?.displayName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">{currentUser?.displayName}</Typography>
            <Typography variant="caption" color="text.secondary">{currentUser?.email}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { icon: LocationIcon, color: 'info', label: 'Zones Actives', value: stats.totalZones },
          { icon: DevicesIcon, color: 'success', label: 'Devices Connectés', value: stats.connectedDevices },
          { icon: WarningIcon, color: stats.activeAlerts > 0 ? 'error' : 'warning', label: 'Alertes', value: stats.activeAlerts },
          { icon: WarningIcon, color: stats.violations > 0 ? 'error' : 'success', label: 'Violations', value: stats.violations },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${stat.color}.main` }}>
                  <stat.icon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">{stat.label}</Typography>
                  <Typography variant="h4">{stat.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Map + Sidebar */}
      <Grid container spacing={3} sx={{ height: 'calc(100% - 180px)' }}>
        <Grid item xs={12} md={8} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            {!mapReady ? (
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2
              }}>
                <CircularProgress />
                <Typography>
                  {!window.google?.maps ? 'Chargement Google Maps...' : 'Initialisation carte...'}
                </Typography>
              </Box>
            ) : null}
            
            {/* ✅ DIV avec ref - toujours rendu mais caché si pas prêt */}
            <div 
              ref={mapContainerRef}
              style={{ 
                width: '100%', 
                height: '100%',
                visibility: mapReady ? 'visible' : 'hidden'
              }} 
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', overflow: 'auto' }}>
            {stats.activeAlerts > 0 && (
              <Box sx={{ p: 2, bgcolor: 'error.light' }}>
                <Typography variant="subtitle2" color="error.dark" fontWeight="bold">
                  🚨 ALERTES ({stats.activeAlerts})
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
                      secondary={`${zone.type === 'danger' ? '⚠️' : '🔒'} ${Math.round(zone.radius)}m`}
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
                        <SmartButton />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {device.name}
                          <Chip size="small" label={device.status} color={getStatusColor(device.status)} />
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BatteryIcon fontSize="small" />
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