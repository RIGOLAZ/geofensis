// components/zones/ZoneEditor/MapEditor.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../../../context/GoogleMapsContext';
import { Box, CircularProgress, Alert, Button, ButtonGroup } from '@mui/material';

const MapEditor = ({ onSave, defaultType = 'circle', initialGeometry = null }) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawingManagerRef = useRef(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [drawMode, setDrawMode] = useState(defaultType); // 'circle' | 'polygon'

  // Initialisation de la carte
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current) return;

    // Centre par défaut ou centre de la géométrie initiale
    const center = initialGeometry?.center || { lat: 48.8566, lng: 2.3522 };

    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center,
      zoom: 15,
      mapTypeId: 'roadmap',
      mapTypeControl: true,
      streetViewControl: false,
    });

    // Si géométrie initiale, l'afficher
    if (initialGeometry) {
      displayInitialGeometry(initialGeometry);
    }

    // Initialiser le DrawingManager
    initDrawingManager();

  }, [isLoaded]);

  const displayInitialGeometry = (geometry) => {
    if (geometry.type === 'circle' && geometry.center) {
      const circle = new window.google.maps.Circle({
        map: mapRef.current,
        center: geometry.center,
        radius: geometry.radius || 100,
        fillColor: '#4CAF50',
        fillOpacity: 0.3,
        strokeColor: '#4CAF50',
        strokeWeight: 2,
        editable: true,
        draggable: true,
      });
      setSelectedShape(circle);
      mapRef.current.fitBounds(circle.getBounds());
    } else if (geometry.type === 'polygon' && geometry.coordinates?.length > 2) {
      const polygon = new window.google.maps.Polygon({
        map: mapRef.current,
        paths: geometry.coordinates,
        fillColor: '#4CAF50',
        fillOpacity: 0.3,
        strokeColor: '#4CAF50',
        strokeWeight: 2,
        editable: true,
        draggable: true,
      });
      setSelectedShape(polygon);
      
      // Centrer sur le polygon
      const bounds = new window.google.maps.LatLngBounds();
      geometry.coordinates.forEach(coord => bounds.extend(coord));
      mapRef.current.fitBounds(bounds);
    }
  };

  const initDrawingManager = () => {
    // Supprimer l'ancien drawing manager si existe
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
    }

    const drawingMode = drawMode === 'circle' 
      ? window.google.maps.drawing.OverlayType.CIRCLE
      : window.google.maps.drawing.OverlayType.POLYGON;

    drawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
      drawingMode: null, // Ne pas démarrer en mode dessin automatiquement
      drawingControl: false, // On utilise nos propres boutons
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          window.google.maps.drawing.OverlayType.CIRCLE,
          window.google.maps.drawing.OverlayType.POLYGON,
        ],
      },
      circleOptions: {
        fillColor: '#4CAF50',
        fillOpacity: 0.3,
        strokeColor: '#4CAF50',
        strokeWeight: 2,
        editable: true,
        draggable: true,
      },
      polygonOptions: {
        fillColor: '#4CAF50',
        fillOpacity: 0.3,
        strokeColor: '#4CAF50',
        strokeWeight: 2,
        editable: true,
        draggable: true,
      },
    });

    drawingManagerRef.current.setMap(mapRef.current);

    // Événement: forme créée
    window.google.maps.event.addListener(
      drawingManagerRef.current,
      'overlaycomplete',
      (event) => {
        // Supprimer l'ancienne forme
        if (selectedShape) {
          selectedShape.setMap(null);
        }

        const newShape = event.overlay;
        setSelectedShape(newShape);
        
        // Désactiver le mode dessin
        drawingManagerRef.current.setDrawingMode(null);

        // Écouter les modifications
        if (event.type === window.google.maps.drawing.OverlayType.CIRCLE) {
          window.google.maps.event.addListener(newShape, 'radius_changed', () => {
            console.log('Rayon changé:', newShape.getRadius());
          });
          window.google.maps.event.addListener(newShape, 'center_changed', () => {
            console.log('Centre changé:', newShape.getCenter().toJSON());
          });
        } else {
          window.google.maps.event.addListener(newShape.getPath(), 'set_at', () => {
            console.log('Polygon modifié');
          });
        }
      }
    );
  };

  const startDrawing = (mode) => {
    setDrawMode(mode);
    
    // Supprimer la forme existante
    if (selectedShape) {
      selectedShape.setMap(null);
      setSelectedShape(null);
    }

    const drawingMode = mode === 'circle'
      ? window.google.maps.drawing.OverlayType.CIRCLE
      : window.google.maps.drawing.OverlayType.POLYGON;

    drawingManagerRef.current.setDrawingMode(drawingMode);
  };

  const clearShape = () => {
    if (selectedShape) {
      selectedShape.setMap(null);
      setSelectedShape(null);
    }
  };

  const handleSave = () => {
    if (!selectedShape) {
      alert('Veuillez dessiner une zone d\'abord');
      return;
    }

    let data;
    if (selectedShape instanceof window.google.maps.Circle) {
      data = {
        type: 'circle',
        center: selectedShape.getCenter().toJSON(),
        radius: Math.round(selectedShape.getRadius()),
      };
    } else {
      const path = selectedShape.getPath();
      const coordinates = [];
      for (let i = 0; i < path.getLength(); i++) {
        coordinates.push(path.getAt(i).toJSON());
      }
      data = {
        type: 'polygon',
        coordinates,
      };
    }

    onSave(data);
  };

  if (loadError) {
    return <Alert severity="error">Erreur chargement Google Maps: {loadError.message}</Alert>;
  }

  if (!isLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Contrôles */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <ButtonGroup variant="contained" size="small">
          <Button 
            onClick={() => startDrawing('circle')}
            color={drawMode === 'circle' ? 'primary' : 'inherit'}
          >
            ⭕ Cercle
          </Button>
          <Button 
            onClick={() => startDrawing('polygon')}
            color={drawMode === 'polygon' ? 'primary' : 'inherit'}
          >
            ⬡ Polygone
          </Button>
        </ButtonGroup>
        
        <Button variant="outlined" color="error" onClick={clearShape} size="small">
          🗑️ Effacer
        </Button>
        
        <Button variant="contained" color="success" onClick={handleSave} size="small">
          ✓ Valider
        </Button>
      </Box>

      {/* Carte */}
      <Box
        ref={mapContainerRef}
        sx={{
          flex: 1,
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid #ddd',
        }}
      />
    </Box>
  );
};

export default MapEditor;