import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, DrawingManager, Polygon, Circle } from '@react-google-maps/api';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Switch, 
  FormControlLabel, 
  Chip, 
  Stack,
  CircularProgress,
  Alert
} from '@mui/material';
import { useGoogleMaps } from '../../../context/GoogleMapsContext';
import { getAlertColor } from '../../../config/googleMaps';

const MapEditor = ({ onSave, initialZone = null }) => {
  const { isLoaded, loadError, google } = useGoogleMaps();
  
  const [map, setMap] = useState(null);
  const [drawingMode, setDrawingMode] = useState(null);
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
  
  const [geometry, setGeometry] = useState(() => {
    if (!initialZone) return null;
    return {
      type: initialZone.type,
      center: initialZone.center,
      radius: initialZone.radius,
      coordinates: initialZone.coordinates,
    };
  });
  
  const drawingManagerRef = useRef(null);
  const overlaysRef = useRef([]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    
    if (initialZone) {
      if (initialZone.type === 'circle' && initialZone.center) {
        mapInstance.setCenter(initialZone.center);
        mapInstance.setZoom(15);
      } else if (initialZone.type === 'polygon' && initialZone.coordinates?.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        initialZone.coordinates.forEach(coord => bounds.extend(coord));
        mapInstance.fitBounds(bounds);
      }
    }
  }, [initialZone]);

  const clearOverlays = () => {
    overlaysRef.current.forEach(overlay => {
      if (overlay && overlay.setMap) {
        overlay.setMap(null);
      }
    });
    overlaysRef.current = [];
  };

  const onOverlayComplete = useCallback((e) => {
    clearOverlays();
    
    if (e.overlay && e.overlay.setMap) {
      e.overlay.setMap(null);
    }

    if (e.type === window.google.maps.drawing.OverlayType.CIRCLE) {
      const center = e.overlay.getCenter();
      const radius = e.overlay.getRadius();

      setGeometry({
        type: 'circle',
        center: { lat: center.lat(), lng: center.lng() },
        radius: radius,
      });
    } else if (e.type === window.google.maps.drawing.OverlayType.POLYGON) {
      const path = e.overlay.getPath();
      const coordinates = [];

      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push({ lat: point.lat(), lng: point.lng() });
      }

      // Fermer le polygone
      if (coordinates.length > 0) {
        const first = coordinates[0];
        const last = coordinates[coordinates.length - 1];
        if (first.lat !== last.lat || first.lng !== last.lng) {
          coordinates.push({ ...first });
        }
      }

      setGeometry({
        type: 'polygon',
        coordinates: coordinates,
      });
    }

    setDrawingMode(null);
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, []);

  const handleDrawingModeChange = (mode) => {
    const newMode = drawingMode === mode ? null : mode;
    setDrawingMode(newMode);
    
    if (drawingManagerRef.current && window.google?.maps?.drawing) {
      drawingManagerRef.current.setDrawingMode(
        newMode ? window.google.maps.drawing.OverlayType[newMode.toUpperCase()] : null
      );
    }
    
    if (newMode && geometry) {
      setGeometry(null);
      clearOverlays();
    }
  };

  const handleSave = () => {
    if (!geometry) {
      alert('Veuillez dessiner une zone sur la carte');
      return;
    }

    if (!zoneData.name.trim()) {
      alert('Veuillez donner un nom à la zone');
      return;
    }

    onSave({
      ...zoneData,
      ...geometry,
      updatedAt: new Date(),
      createdAt: initialZone?.createdAt || new Date(),
    });
  };

  const onDrawingManagerLoad = useCallback((drawingManager) => {
    drawingManagerRef.current = drawingManager;
  }, []);

  // Gestion des états de chargement
  if (loadError) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>Erreur Google Maps</Typography>
          <Typography>{loadError.message}</Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Vérifiez votre clé API et la connexion internet.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!isLoaded || !window.google?.maps?.drawing) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="textSecondary">
          Chargement de la carte...
        </Typography>
      </Box>
    );
  }

  const alertColor = getAlertColor(zoneData.alertLevel);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Panneau latéral */}
      <Paper sx={{ width: 400, p: 3, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          {initialZone ? 'Modifier la Zone' : 'Nouvelle Zone'}
        </Typography>

        <TextField
          fullWidth
          label="Nom de la zone"
          value={zoneData.name}
          onChange={(e) => setZoneData({ ...zoneData, name: e.target.value })}
          margin="normal"
          required
          error={!zoneData.name.trim()}
          helperText={!zoneData.name.trim() ? 'Champ requis' : ''}
        />

        <TextField
          fullWidth
          label="Description"
          multiline
          rows={3}
          value={zoneData.description}
          onChange={(e) => setZoneData({ ...zoneData, description: e.target.value })}
          margin="normal"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Niveau d'alerte</InputLabel>
          <Select
            value={zoneData.alertLevel}
            onChange={(e) => setZoneData({ ...zoneData, alertLevel: e.target.value })}
            label="Niveau d'alerte"
          >
            <MenuItem value="low">Faible (Vert)</MenuItem>
            <MenuItem value="medium">Moyen (Orange)</MenuItem>
            <MenuItem value="high">Critique (Rouge)</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="medium">
            Messages personnalisés
          </Typography>
          <TextField
            fullWidth
            label="Message d'entrée"
            value={zoneData.entryMessage}
            onChange={(e) => setZoneData({ ...zoneData, entryMessage: e.target.value })}
            margin="dense"
            placeholder="Vous entrez dans une zone sécurisée"
            size="small"
          />
          <TextField
            fullWidth
            label="Message de sortie"
            value={zoneData.exitMessage}
            onChange={(e) => setZoneData({ ...zoneData, exitMessage: e.target.value })}
            margin="dense"
            placeholder="Vous quittez la zone"
            size="small"
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={zoneData.smsAlert}
                onChange={(e) => setZoneData({ ...zoneData, smsAlert: e.target.checked })}
              />
            }
            label="Alerte SMS"
          />

          {zoneData.smsAlert && (
            <TextField
              fullWidth
              label="Numéro de contact"
              value={zoneData.contactPhone}
              onChange={(e) => setZoneData({ ...zoneData, contactPhone: e.target.value })}
              margin="normal"
              placeholder="+33612345678"
              size="small"
            />
          )}
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={zoneData.soundAlert}
              onChange={(e) => setZoneData({ ...zoneData, soundAlert: e.target.checked })}
            />
          }
          label="Alerte sonore"
        />

        <FormControlLabel
          control={
            <Switch
              checked={zoneData.predictiveAlerts}
              onChange={(e) => setZoneData({ ...zoneData, predictiveAlerts: e.target.checked })}
            />
          }
          label="Alertes prédictives (30s avant)"
        />

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            fullWidth
            disabled={!geometry || !zoneData.name.trim()}
            size="large"
          >
            {initialZone ? 'Mettre à jour' : 'Sauvegarder'}
          </Button>
        </Stack>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Outils de dessin
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant={drawingMode === 'circle' ? 'contained' : 'outlined'}
              onClick={() => handleDrawingModeChange('circle')}
              size="small"
              color={drawingMode === 'circle' ? 'primary' : 'inherit'}
            >
              Cercle
            </Button>
            <Button
              variant={drawingMode === 'polygon' ? 'contained' : 'outlined'}
              onClick={() => handleDrawingModeChange('polygon')}
              size="small"
              color={drawingMode === 'polygon' ? 'primary' : 'inherit'}
            >
              Polygone
            </Button>
            {geometry && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => {
                  setGeometry(null);
                  clearOverlays();
                  setDrawingMode(null);
                  if (drawingManagerRef.current) {
                    drawingManagerRef.current.setDrawingMode(null);
                  }
                }}
              >
                Effacer
              </Button>
            )}
          </Stack>
        </Box>

        {geometry && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Chip
              label={`Type: ${geometry.type === 'circle' ? 'Cercle' : 'Polygone'}`}
              color="success"
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
            {geometry.type === 'circle' && (
              <Typography variant="body2" color="textSecondary">
                Rayon: {(geometry.radius / 1000).toFixed(2)} km
              </Typography>
            )}
            {geometry.type === 'polygon' && (
              <Typography variant="body2" color="textSecondary">
                Points: {geometry.coordinates.length}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Carte */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={initialZone?.center || { lat: 48.8566, lng: 2.3522 }}
          zoom={initialZone ? 15 : 13}
          onLoad={onLoad}
          options={{
            mapTypeId: 'hybrid',
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: true,
            mapTypeControlOptions: {
              position: window.google.maps.ControlPosition.TOP_RIGHT,
            },
          }}
        >
          <DrawingManager
            onLoad={onDrawingManagerLoad}
            onOverlayComplete={onOverlayComplete}
            options={{
              drawingControl: false,
              drawingMode: drawingMode ? window.google.maps.drawing.OverlayType[drawingMode.toUpperCase()] : null,
              circleOptions: {
                fillColor: alertColor,
                fillOpacity: 0.3,
                strokeWeight: 2,
                strokeColor: alertColor,
                clickable: false,
                editable: true,
                draggable: true,
                zIndex: 1,
              },
              polygonOptions: {
                fillColor: alertColor,
                fillOpacity: 0.3,
                strokeWeight: 2,
                strokeColor: alertColor,
                clickable: false,
                editable: true,
                draggable: true,
                zIndex: 1,
              },
            }}
          />

          {geometry?.type === 'circle' && (
            <Circle
              center={geometry.center}
              radius={geometry.radius}
              options={{
                fillColor: alertColor,
                fillOpacity: 0.3,
                strokeColor: alertColor,
                strokeWeight: 2,
                editable: true,
                draggable: true,
              }}
              onLoad={(circle) => {
                overlaysRef.current.push(circle);
                
                const updateCircle = () => {
                  const center = circle.getCenter();
                  const radius = circle.getRadius();
                  setGeometry(prev => ({
                    ...prev,
                    center: { lat: center.lat(), lng: center.lng() },
                    radius: radius,
                  }));
                };

                window.google.maps.event.addListener(circle, 'radius_changed', updateCircle);
                window.google.maps.event.addListener(circle, 'center_changed', updateCircle);
              }}
            />
          )}

          {geometry?.type === 'polygon' && (
            <Polygon
              paths={geometry.coordinates}
              options={{
                fillColor: alertColor,
                fillOpacity: 0.3,
                strokeColor: alertColor,
                strokeWeight: 2,
                editable: true,
                draggable: true,
              }}
              onLoad={(polygon) => {
                overlaysRef.current.push(polygon);
                
                const updatePolygon = () => {
                  const path = polygon.getPath();
                  const coords = [];
                  for (let i = 0; i < path.getLength(); i++) {
                    const point = path.getAt(i);
                    coords.push({ lat: point.lat(), lng: point.lng() });
                  }
                  setGeometry(prev => ({
                    ...prev,
                    coordinates: coords,
                  }));
                };

                window.google.maps.event.addListener(polygon.getPath(), 'set_at', updatePolygon);
                window.google.maps.event.addListener(polygon.getPath(), 'insert_at', updatePolygon);
                window.google.maps.event.addListener(polygon.getPath(), 'remove_at', updatePolygon);
              }}
            />
          )}
        </GoogleMap>
      </Box>
    </Box>
  );
};

export default MapEditor;