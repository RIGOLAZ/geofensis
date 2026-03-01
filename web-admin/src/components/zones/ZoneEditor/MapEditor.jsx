import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Switch, FormControlLabel, Chip, Stack, CircularProgress, Alert, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { Circle as CircleIcon, Pentagon as PolygonIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useGoogleMaps } from '../../../context/GoogleMapsContext';

const MapEditor = ({ onSave, initialZone = null }) => {
  const { isLoaded, loadError, google } = useGoogleMaps();
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const drawingRef = useRef({
    markers: [],
    shapes: [],
    tempPolyline: null,
    clickListener: null,
  });
  
  const [drawingMode, setDrawingMode] = useState(null);
  const [geometry, setGeometry] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]); // ✅ Renommé pour clarté
  const [circleStep, setCircleStep] = useState(0);
  
  const [zoneData, setZoneData] = useState({
    name: initialZone?.name || '',
    type: initialZone?.type || 'circle',
    description: initialZone?.description || '',
    alertLevel: initialZone?.alertLevel || 'medium',
    entryMessage: initialZone?.entryMessage || '',
    exitMessage: initialZone?.exitMessage || '',
    smsAlert: initialZone?.smsAlert || false,
    contactPhone: initialZone?.contactPhone || '',
    soundAlert: initialZone?.soundAlert !== false,
    predictiveAlerts: initialZone?.predictiveAlerts !== false,
    active: initialZone?.active !== false,
  });

  const getAlertColor = useCallback((level) => {
    switch (level) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#2196f3';
    }
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!isLoaded || !google?.maps?.Map || !mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: initialZone?.center || { lat: 48.8566, lng: 2.3522 },
      zoom: initialZone ? 15 : 13,
      mapTypeId: 'hybrid',
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
    });
    
    mapInstanceRef.current = map;

    if (initialZone) {
      displayExistingZone(initialZone, map);
    }

    return () => cleanup();
  }, [isLoaded, google, initialZone, getAlertColor]);

  const cleanup = () => {
    if (drawingRef.current.clickListener) {
      google.maps.event.removeListener(drawingRef.current.clickListener);
    }
    drawingRef.current.markers.forEach(m => m.setMap?.(null));
    drawingRef.current.shapes.forEach(s => s.setMap?.(null));
    if (drawingRef.current.tempPolyline) {
      drawingRef.current.tempPolyline.setMap(null);
    }
    drawingRef.current = { markers: [], shapes: [], tempPolyline: null, clickListener: null };
    mapInstanceRef.current = null;
  };

  const clearDrawing = useCallback(() => {
    if (drawingRef.current.clickListener) {
      google.maps.event.removeListener(drawingRef.current.clickListener);
      drawingRef.current.clickListener = null;
    }
    
    drawingRef.current.markers.forEach(m => m.setMap?.(null));
    drawingRef.current.shapes.forEach(s => s.setMap?.(null));
    if (drawingRef.current.tempPolyline) {
      drawingRef.current.tempPolyline.setMap(null);
    }
    
    drawingRef.current.markers = [];
    drawingRef.current.shapes = [];
    drawingRef.current.tempPolyline = null;
    
    setGeometry(null);
    setPolygonPoints([]); // ✅ Reset ici
    setCircleStep(0);
    setDrawingMode(null);
  }, [google]);

  const displayExistingZone = useCallback((zone, map) => {
    const color = getAlertColor(zone.alertLevel);
    
    if (zone.type === 'circle' && zone.center && zone.radius) {
      const circle = new google.maps.Circle({
        map, 
        center: zone.center, 
        radius: zone.radius,
        fillColor: color, 
        fillOpacity: 0.3, 
        strokeColor: color, 
        strokeWeight: 2,
        editable: true, 
        draggable: true,
      });
      
      drawingRef.current.shapes.push(circle);
      setGeometry({ type: 'circle', center: zone.center, radius: zone.radius, instance: circle });
      setCircleStep(2);
      
      circle.addListener('radius_changed', () => {
        setGeometry(prev => ({ ...prev, radius: circle.getRadius() }));
      });
      
      circle.addListener('center_changed', () => {
        const c = circle.getCenter();
        setGeometry(prev => ({ ...prev, center: { lat: c.lat(), lng: c.lng() } }));
      });
      
    } else if (zone.type === 'polygon' && zone.coordinates?.length > 0) {
      const polygon = new google.maps.Polygon({
        map, 
        paths: zone.coordinates,
        fillColor: color, 
        fillOpacity: 0.3, 
        strokeColor: color, 
        strokeWeight: 2,
        editable: true, 
        draggable: true,
      });
      
      drawingRef.current.shapes.push(polygon);
      setGeometry({ type: 'polygon', coordinates: zone.coordinates, instance: polygon });
    }
  }, [getAlertColor, google]);

  // Gérer le changement de mode de dessin
  useEffect(() => {
    if (!mapInstanceRef.current || !google) return;
    
    if (drawingRef.current.clickListener) {
      google.maps.event.removeListener(drawingRef.current.clickListener);
      drawingRef.current.clickListener = null;
    }

    if (!drawingMode) return;

    console.log(`✏️ Mode: ${drawingMode}`);

    // ✅ NOUVEAU: Désactiver les contrôles de carte pendant le dessin
    mapInstanceRef.current.setOptions({
      draggable: false,
      zoomControl: false,
      scrollwheel: false,
    });
    
    drawingRef.current.clickListener = mapInstanceRef.current.addListener('click', (e) => {
      handleMapClick(e);
    });

    return () => {
      // Réactiver les contrôles quand on quitte le mode
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setOptions({
          draggable: true,
          zoomControl: true,
          scrollwheel: true,
        });
      }
    };
  }, [drawingMode, google]);

  const handleMapClick = useCallback((e) => {
    if (!drawingMode || !mapInstanceRef.current) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const color = getAlertColor(zoneData.alertLevel);

    console.log(`🖱️ Click ${drawingMode}:`, lat, lng);

    if (drawingMode === 'circle') {
      handleCircleClick(lat, lng, color);
    } else if (drawingMode === 'polygon') {
      handlePolygonClick(lat, lng, color);
    }
  }, [drawingMode, zoneData.alertLevel, getAlertColor, geometry, polygonPoints, circleStep]);

  const handleCircleClick = (lat, lng, color) => {
    if (circleStep === 0) {
      console.log('⭕ Étape 1: Centre');
      
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        label: 'C',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }
      });
      
      drawingRef.current.markers.push(marker);
      setGeometry({ type: 'circle_temp', center: { lat, lng } });
      setCircleStep(1);
      
    } else if (circleStep === 1 && geometry?.center) {
      console.log('⭕ Étape 2: Rayon');
      
      const center = geometry.center;
      const radius = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(center.lat, center.lng),
        new google.maps.LatLng(lat, lng)
      );
      
      drawingRef.current.markers.forEach(m => m.setMap(null));
      drawingRef.current.markers = [];
      
      const circle = new google.maps.Circle({
        map: mapInstanceRef.current,
        center: center,
        radius: radius,
        fillColor: color,
        fillOpacity: 0.3,
        strokeColor: color,
        strokeWeight: 2,
        editable: true,
        draggable: true,
      });
      
      drawingRef.current.shapes.push(circle);
      setGeometry({ type: 'circle', center, radius, instance: circle });
      setCircleStep(2);
      setDrawingMode(null);
      
      circle.addListener('radius_changed', () => {
        setGeometry(prev => ({ ...prev, radius: circle.getRadius() }));
      });
      
      circle.addListener('center_changed', () => {
        const c = circle.getCenter();
        setGeometry(prev => ({ ...prev, center: { lat: c.lat(), lng: c.lng() } }));
      });
    }
  };

  // ✅ CORRECTION: Fonction handlePolygonClick corrigée
  const handlePolygonClick = (lat, lng, color) => {
    console.log('📍 Ajout point polygon:', lat, lng);
    
    // ✅ Utiliser la valeur actuelle des points, pas l'état React qui peut être stale
    const currentPoints = polygonPoints;
    const newPoint = { lat, lng };
    const updatedPoints = [...currentPoints, newPoint];
    
    console.log('📊 Total points:', updatedPoints.length);
    
    // Mettre à jour l'état React
    setPolygonPoints(updatedPoints);
    
    // Ajouter marker
    const marker = new google.maps.Marker({
      position: newPoint,
      map: mapInstanceRef.current,
      label: {
        text: String(updatedPoints.length),
        color: 'white',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#2196f3',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      }
    });
    drawingRef.current.markers.push(marker);
    
    // Mettre à jour ou créer la polyligne
    if (drawingRef.current.tempPolyline) {
      drawingRef.current.tempPolyline.setPath(updatedPoints);
    } else {
      drawingRef.current.tempPolyline = new google.maps.Polyline({
        path: updatedPoints,
        map: mapInstanceRef.current,
        strokeColor: '#2196f3',
        strokeOpacity: 1,
        strokeWeight: 3,
        geodesic: true,
      });
    }
  };

  // ✅ CORRECTION: Utiliser polygonPoints.length directement
  const finalizePolygon = useCallback(() => {
    console.log('🔷 Finalisation, points:', polygonPoints.length);
    
    if (polygonPoints.length < 3) {
      alert(`Minimum 3 points requis. Actuellement: ${polygonPoints.length} point(s)`);
      return;
    }
    
    const color = getAlertColor(zoneData.alertLevel);
    const coords = [...polygonPoints, polygonPoints[0]]; // Fermer
    
    drawingRef.current.markers.forEach(m => m.setMap(null));
    drawingRef.current.markers = [];
    
    if (drawingRef.current.tempPolyline) {
      drawingRef.current.tempPolyline.setMap(null);
      drawingRef.current.tempPolyline = null;
    }
    
    const polygon = new google.maps.Polygon({
      map: mapInstanceRef.current,
      paths: coords,
      fillColor: color,
      fillOpacity: 0.3,
      strokeColor: color,
      strokeWeight: 2,
      editable: true,
      draggable: true,
    });
    
    drawingRef.current.shapes.push(polygon);
    setGeometry({ type: 'polygon', coordinates: coords, instance: polygon });
    setPolygonPoints([]); // Reset
    setDrawingMode(null);
  }, [polygonPoints, zoneData.alertLevel, getAlertColor]);

  const handleSave = () => {
    if (!geometry) {
      alert('Veuillez dessiner une zone');
      return;
    }
    if (!zoneData.name.trim()) {
      alert('Nom requis');
      return;
    }

    const data = {
      ...zoneData,
      type: geometry.type,
      ...(geometry.type === 'circle' 
        ? { center: geometry.center, radius: geometry.radius }
        : { coordinates: geometry.coordinates }
      ),
      updatedAt: new Date(),
      createdAt: initialZone?.createdAt || new Date(),
    };

    onSave(data);
  };

  if (loadError) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">Erreur: {loadError.message}</Alert>
      </Box>
    );
  }

  if (!isLoaded || !google?.maps?.Map) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Paper sx={{ width: 400, p: 3, overflow: 'auto', zIndex: 10 }}>
        <Typography variant="h5" gutterBottom>{initialZone ? 'Modifier' : 'Nouvelle'} Zone</Typography>

        <TextField fullWidth label="Nom" value={zoneData.name} 
          onChange={(e) => setZoneData({ ...zoneData, name: e.target.value })} 
          margin="normal" required error={!zoneData.name.trim()} />

        <TextField fullWidth label="Description" multiline rows={3} 
          value={zoneData.description} onChange={(e) => setZoneData({ ...zoneData, description: e.target.value })} 
          margin="normal" />

        <FormControl fullWidth margin="normal">
          <InputLabel>Niveau d'alerte</InputLabel>
          <Select value={zoneData.alertLevel} onChange={(e) => setZoneData({ ...zoneData, alertLevel: e.target.value })}>
            <MenuItem value="low">Faible (Vert)</MenuItem>
            <MenuItem value="medium">Moyen (Orange)</MenuItem>
            <MenuItem value="high">Critique (Rouge)</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Messages</Typography>
          <TextField fullWidth label="Entrée" value={zoneData.entryMessage} 
            onChange={(e) => setZoneData({ ...zoneData, entryMessage: e.target.value })} margin="dense" />
          <TextField fullWidth label="Sortie" value={zoneData.exitMessage} 
            onChange={(e) => setZoneData({ ...zoneData, exitMessage: e.target.value })} margin="dense" />
        </Box>

        <FormControlLabel control={<Switch checked={zoneData.smsAlert} onChange={(e) => setZoneData({ ...zoneData, smsAlert: e.target.checked })} />} label="Alerte SMS" />
        {zoneData.smsAlert && <TextField fullWidth label="Téléphone" value={zoneData.contactPhone} onChange={(e) => setZoneData({ ...zoneData, contactPhone: e.target.value })} margin="normal" />}
        
        <FormControlLabel control={<Switch checked={zoneData.soundAlert} onChange={(e) => setZoneData({ ...zoneData, soundAlert: e.target.checked })} />} label="Alerte sonore" />
        <FormControlLabel control={<Switch checked={zoneData.predictiveAlerts} onChange={(e) => setZoneData({ ...zoneData, predictiveAlerts: e.target.checked })} />} label="Prédictive (30s)" />

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {!drawingMode && 'Outils de dessin'}
            {drawingMode === 'circle' && circleStep === 0 && '⭕ Cliquez pour le CENTRE'}
            {drawingMode === 'circle' && circleStep === 1 && '⭕ Cliquez pour le RAYON'}
            {drawingMode === 'polygon' && `📍 Cliquez pour ajouter (${polygonPoints.length} point${polygonPoints.length > 1 ? 's' : ''})`}
          </Typography>
          
          <ToggleButtonGroup 
            value={drawingMode} 
            exclusive 
            onChange={(e, m) => {
              if (m !== null) {
                clearDrawing();
                setDrawingMode(m);
              }
            }} 
            fullWidth 
            size="small"
            disabled={!!geometry}
          >
            <ToggleButton value="circle">
              <CircleIcon sx={{ mr: 1 }} />
              Cercle
            </ToggleButton>
            <ToggleButton value="polygon">
              <PolygonIcon sx={{ mr: 1 }} />
              Polygone
            </ToggleButton>
          </ToggleButtonGroup>

          {drawingMode === 'polygon' && polygonPoints.length > 0 && (
            <Button 
              variant="contained" 
              color="success" 
              fullWidth 
              sx={{ mt: 1 }} 
              onClick={finalizePolygon}
            >
              Finaliser ({polygonPoints.length} point{polygonPoints.length > 1 ? 's' : ''})
            </Button>
          )}

          {geometry && (
            <Button variant="outlined" color="error" fullWidth sx={{ mt: 1 }} startIcon={<DeleteIcon />} onClick={clearDrawing}>
              Effacer
            </Button>
          )}
        </Box>

        <Button variant="contained" color="primary" onClick={handleSave} fullWidth size="large" 
          disabled={!geometry || !zoneData.name.trim()} sx={{ mt: 3 }}>
          {initialZone ? 'Mettre à jour' : 'Sauvegarder'}
        </Button>

        {geometry && (
          <Box sx={{ mt: 2 }}>
            <Chip label={`${geometry.type === 'circle' ? 'Cercle' : 'Polygone'}`} color="success" variant="outlined" />
            {geometry.type === 'circle' && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Rayon: {(geometry.radius / 1000).toFixed(2)} km
              </Typography>
            )}
            {geometry.type === 'polygon' && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {geometry.coordinates.length - 1} points
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      <Box sx={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </Box>
    </Box>
  );
};

export default MapEditor;