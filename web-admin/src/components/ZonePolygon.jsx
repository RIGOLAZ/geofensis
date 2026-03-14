// components/ZonePolygon.jsx
import React, { useMemo } from 'react';
import { Polygon } from '@react-google-maps/api';

const ZONE_COLORS = {
  safe: {
    fill: '#22c55e',      // Vert
    fillOpacity: 0.2,
    stroke: '#16a34a',
    strokeOpacity: 0.8,
    strokeWeight: 2
  },
  approaching: {
    fill: '#f59e0b',      // Orange
    fillOpacity: 0.3,
    stroke: '#d97706',
    strokeOpacity: 1,
    strokeWeight: 3
  },
  violated: {
    fill: '#ef4444',      // Rouge
    fillOpacity: 0.4,
    stroke: '#dc2626',
    strokeOpacity: 1,
    strokeWeight: 3
  }
};

export const ZonePolygon = ({ zone, devices, isSelected }) => {
  
  // 🎯 Calculer le statut de violation pour cette zone
  const zoneStatus = useMemo(() => {
    let hasViolation = false;
    let hasApproaching = false;
    
    devices.forEach(device => {
      const distance = calculateDistanceToZone(device.position, zone.coordinates);
      
      if (distance < 0) {
        hasViolation = true; // À l'extérieur
      } else if (distance < 50) { // 50m du bord
        hasApproaching = true;
      }
    });
    
    if (hasViolation) return 'violated';
    if (hasApproaching) return 'approaching';
    return 'safe';
  }, [zone, devices]);

  const colors = ZONE_COLORS[zoneStatus];
  
  // Animation pulse si violation
  const animationStyle = zoneStatus === 'violated' ? {
    animation: 'pulse-red 1.5s infinite'
  } : {};

  return (
    <Polygon
      paths={zone.coordinates}
      options={{
        ...colors,
        editable: isSelected,
        draggable: isSelected,
      }}
      onClick={() => onZoneClick?.(zone)}
    >
      {/* Effet visuel supplémentaire */}
      {zoneStatus === 'violated' && (
        <div className="zone-alert-indicator" style={animationStyle} />
      )}
    </Polygon>
  );
};

// CSS pour l'animation
/*
@keyframes pulse-red {
  0%, 100% { stroke-opacity: 0.8; fill-opacity: 0.3; }
  50% { stroke-opacity: 1; fill-opacity: 0.5; }
}
*/
