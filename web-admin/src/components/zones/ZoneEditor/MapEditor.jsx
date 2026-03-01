import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Switch, FormControlLabel, Chip, Stack, CircularProgress, Alert, ToggleButton, ToggleButtonGroup,
  Stepper, Step, StepLabel
} from '@mui/material';
import { Circle as CircleIcon, Pentagon as PolygonIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useGoogleMaps } from '../../../context/GoogleMapsContext';

const MapEditor = ({ onSave, initialZone = null }) => {
  const { isLoaded, loadError, google } = useGoogleMaps();
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapContainerRef = useRef(null); // Ref pour le conteneur DOM
  
  const polygonPointsRef = useRef([]);
  const markersRef = useRef([]); // Pour AdvancedMarkerElement
  const shapesRef = useRef([]);
  const tempPolylineRef = useRef(null);
  const clickListenerRef = useRef(null);
  const circleCenterRef = useRef(null);
  
  const [activeStep, setActiveStep] = useState(0);
  const [drawingMode, setDrawingMode] = useState(null);
  const [geometry, setGeometry] = useState(null);
  const [pointCount, setPointCount] = useState(0);
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
    if (!isLoaded || !google?.maps?.Map) return;
    if (activeStep === 0 && !initialZone) return;
    if (mapInstanceRef.current) return;

    // Utiliser setTimeout pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) {
        console.error('Conteneur carte non trouvé');
        return;
      }

      console.log('🗺️ Création carte...');
      
      // Lors de la création de la carte, ajoutez mapId:
      const map = new google.maps.Map(mapContainerRef.current, {
        center: initialZone?.center || { lat: 48.8566, lng: 2.3522 },
        zoom: initialZone ? 15 : 13,
        mapTypeId: 'hybrid',
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT,
        },
        // ✅ AJOUT: Map ID requis pour AdvancedMarkerElement
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
      });
      
      mapInstanceRef.current = map;
      mapRef.current = map;

      if (initialZone) {
        displayExistingZone(initialZone, map);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoaded, google, activeStep, initialZone]);

  // Cleanup global
  useEffect(() => {
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
    }
    markersRef.current.forEach(m => m.map = null); // AdvancedMarkerElement
    shapesRef.current.forEach(s => s.setMap?.(null));
    if (tempPolylineRef.current) {
      tempPolylineRef.current.setMap(null);
    }
    mapInstanceRef.current = null;
  };

  const clearDrawing = useCallback(() => {
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }
    
    // Supprimer les AdvancedMarkerElement
    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];
    
    shapesRef.current.forEach(s => s.setMap?.(null));
    shapesRef.current = [];
    
    if (tempPolylineRef.current) {
      tempPolylineRef.current.setMap(null);
      tempPolylineRef.current = null;
    }
    
    polygonPointsRef.current = [];
    circleCenterRef.current = null;
    
    setGeometry(null);
    setPointCount(0);
    setCircleStep(0);
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
      
      shapesRef.current.push(circle);
      setGeometry({ type: 'circle', center: zone.center, radius: zone.radius, instance: circle });
      
      circle.addListener('radius_changed', () => {
        setGeometry(prev => prev ? { ...prev, radius: circle.getRadius() } : null);
      });
      
      circle.addListener('center_changed', () => {
        const c = circle.getCenter();
        setGeometry(prev => prev ? { ...prev, center: { lat: c.lat(), lng: c.lng() } } : null);
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
      
      shapesRef.current.push(polygon);
      setGeometry({ type: 'polygon', coordinates: zone.coordinates, instance: polygon });
    }
  }, [getAlertColor, google]);

  useEffect(() => {
    if (!mapInstanceRef.current || !google) return;
    
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    if (!drawingMode) return;

    clearDrawing();
    
    clickListenerRef.current = mapInstanceRef.current.addListener('click', (e) => {
      handleMapClick(e);
    });

  }, [drawingMode, google, clearDrawing]);

  const handleMapClick = useCallback((e) => {
    if (!drawingMode || !mapInstanceRef.current) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const color = getAlertColor(zoneData.alertLevel);

    if (drawingMode === 'circle') {
      handleCircleClick(lat, lng, color);
    } else if (drawingMode === 'polygon') {
      handlePolygonClick(lat, lng, color);
    }
  }, [drawingMode, zoneData.alertColor, getAlertColor, circleStep]);

  // ✅ CERCLE avec AdvancedMarkerElement
  const handleCircleClick = async (lat, lng, color) => {
    if (circleStep === 0) {
      // Étape 1: Centre
      markersRef.current.forEach(m => m.map = null);
      markersRef.current = [];
      
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      
      const marker = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat, lng },
        title: 'Centre',
        content: buildMarkerContent('C', color),
      });
      
      markersRef.current.push(marker);
      circleCenterRef.current = { lat, lng };
      setCircleStep(1);
      
    } else if (circleStep === 1) {
      // Étape 2: Rayon
      const center = circleCenterRef.current;
      if (!center) return;
      
      const radius = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(center.lat, center.lng),
        new google.maps.LatLng(lat, lng)
      );
      
      markersRef.current.forEach(m => m.map = null);
      markersRef.current = [];
      
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
      
      shapesRef.current.push(circle);
      setGeometry({ type: 'circle', center, radius, instance: circle });
      setCircleStep(0);
      setDrawingMode(null);
      
      circle.addListener('radius_changed', () => {
        setGeometry(prev => prev ? { ...prev, radius: circle.getRadius() } : null);
      });
      
      circle.addListener('center_changed', () => {
        const c = circle.getCenter();
        setGeometry(prev => prev ? { ...prev, center: { lat: c.lat(), lng: c.lng() } } : null);
      });
    }
  };

  // ✅ POLYGONE avec AdvancedMarkerElement
  const handlePolygonClick = async (lat, lng, color) => {
    const newPoint = { lat, lng };
    polygonPointsRef.current.push(newPoint);
    const currentCount = polygonPointsRef.current.length;
    
    setPointCount(currentCount);
    
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    
    const marker = new AdvancedMarkerElement({
      map: mapInstanceRef.current,
      position: newPoint,
      title: `Point ${currentCount}`,
      content: buildMarkerContent(String(currentCount), '#2196f3'),
    });
    
    markersRef.current.push(marker);
    
    if (tempPolylineRef.current) {
      tempPolylineRef.current.setPath(polygonPointsRef.current);
    } else {
      tempPolylineRef.current = new google.maps.Polyline({
        path: polygonPointsRef.current,
        map: mapInstanceRef.current,
        strokeColor: '#2196f3',
        strokeOpacity: 1,
        strokeWeight: 3,
      });
    }
  };

  // ✅ Helper pour créer le contenu du marker
  const buildMarkerContent = (label, color) => {
    const div = document.createElement('div');
    div.style.backgroundColor = color;
    div.style.color = 'white';
    div.style.borderRadius = '50%';
    div.style.width = '28px';
    div.style.height = '28px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.fontWeight = 'bold';
    div.style.fontSize = '14px';
    div.style.border = '2px solid white';
    div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    div.textContent = label;
    return div;
  };

  const finalizePolygon = useCallback(async () => {
    const points = polygonPointsRef.current;
    
    if (points.length < 3) {
      alert(`Minimum 3 points requis. Actuellement: ${points.length}`);
      return;
    }
    
    const color = getAlertColor(zoneData.alertLevel);
    const coords = [...points, points[0]];
    
    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];
    
    if (tempPolylineRef.current) {
      tempPolylineRef.current.setMap(null);
      tempPolylineRef.current = null;
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
    
    shapesRef.current.push(polygon);
    setGeometry({ type: 'polygon', coordinates: coords, instance: polygon });
    polygonPointsRef.current = [];
    setPointCount(0);
    setDrawingMode(null);
  }, [zoneData.alertLevel, getAlertColor]);

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

    if (typeof onSave !== 'function') {
      alert('Erreur: Fonction de sauvegarde non définie');
      return;
    }

    onSave(data);
  };

  const steps = ['Informations', 'Dessin sur la carte'];

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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Stepper activeStep={activeStep} sx={{ p: 2, bgcolor: 'background.paper' }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 ? (
        <Paper sx={{ flex: 1, p: 3, overflow: 'auto', maxWidth: 600, mx: 'auto', mt: 2 }}>
          <Typography variant="h5" gutterBottom>Nouvelle Zone</Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Remplissez les informations puis passez à l'étape de dessin
          </Alert>

          <TextField fullWidth label="Nom *" value={zoneData.name} 
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
            <TextField fullWidth label="Message d'entrée" value={zoneData.entryMessage} 
              onChange={(e) => setZoneData({ ...zoneData, entryMessage: e.target.value })} margin="dense" />
            <TextField fullWidth label="Message de sortie" value={zoneData.exitMessage} 
              onChange={(e) => setZoneData({ ...zoneData, exitMessage: e.target.value })} margin="dense" />
          </Box>

          <FormControlLabel control={<Switch checked={zoneData.smsAlert} onChange={(e) => setZoneData({ ...zoneData, smsAlert: e.target.checked })} />} label="Alerte SMS" />
          {zoneData.smsAlert && <TextField fullWidth label="Téléphone" value={zoneData.contactPhone} onChange={(e) => setZoneData({ ...zoneData, contactPhone: e.target.value })} margin="normal" />}
          
          <FormControlLabel control={<Switch checked={zoneData.soundAlert} onChange={(e) => setZoneData({ ...zoneData, soundAlert: e.target.checked })} />} label="Alerte sonore" />
          <FormControlLabel control={<Switch checked={zoneData.predictiveAlerts} onChange={(e) => setZoneData({ ...zoneData, predictiveAlerts: e.target.checked })} />} label="Prédictive (30s)" />

          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            size="large"
            sx={{ mt: 3 }}
            onClick={() => setActiveStep(1)}
            disabled={!zoneData.name.trim()}
          >
            Suivant: Dessiner la zone
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Paper sx={{ width: 350, p: 3, overflow: 'auto', zIndex: 10 }}>
            <Typography variant="h6" gutterBottom>Dessiner la zone</Typography>
            
            {!geometry && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Sélectionnez un outil et cliquez sur la carte
              </Alert>
            )}

            <ToggleButtonGroup 
              value={drawingMode} 
              exclusive 
              onChange={(e, m) => {
                if (m !== null) {
                  setDrawingMode(m);
                  setCircleStep(0);
                  circleCenterRef.current = null;
                }
              }} 
              fullWidth 
              size="small"
              disabled={!!geometry}
              sx={{ mb: 2 }}
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

            {drawingMode === 'circle' && !geometry && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {circleStep === 0 ? 'Étape 1: Cliquez pour le CENTRE' : 'Étape 2: Cliquez pour le RAYON'}
              </Alert>
            )}

            {drawingMode === 'polygon' && !geometry && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {pointCount} point{pointCount > 1 ? 's' : ''} placé{pointCount > 1 ? 's' : ''}
              </Alert>
            )}

            {drawingMode === 'polygon' && pointCount > 0 && !geometry && (
              <Button 
                variant="contained" 
                color="success" 
                fullWidth 
                sx={{ mb: 2 }} 
                onClick={finalizePolygon}
              >
                Finaliser ({pointCount} points)
              </Button>
            )}

            {geometry && (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  {geometry.type === 'circle' ? 'Cercle' : 'Polygone'} créé
                </Alert>
                
                <Button variant="outlined" color="error" fullWidth sx={{ mb: 2 }} startIcon={<DeleteIcon />} onClick={clearDrawing}>
                  Effacer et redessiner
                </Button>
              </>
            )}

            <Stack spacing={2}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                size="large"
                onClick={handleSave}
                disabled={!geometry}
              >
                SAUVEGARDER
              </Button>
              
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => setActiveStep(0)}
              >
                Retour
              </Button>
            </Stack>
          </Paper>

          {/* ✅ Conteneur carte avec ref correcte */}
          <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <div 
              ref={mapContainerRef}
              style={{ 
                width: '100%', 
                height: '100%',
                minHeight: '400px'
              }} 
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MapEditor;