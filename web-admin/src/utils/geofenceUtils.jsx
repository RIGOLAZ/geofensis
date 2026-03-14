// utils/geofenceUtils.js
import { isPointInPolygon } from 'geolib';

// Vérifie si un point est dans un polygone
export const checkPointInZone = (point, zoneCoords) => {
  return isPointInPolygon(point, zoneCoords);
};

// Calcule la distance minimale d'un point au bord du polygone
export const calculateDistanceToZone = (point, zoneCoords) => {
  const isInside = isPointInPolygon(point, zoneCoords);
  
  if (isInside) {
    // Distance au bord le plus proche (négative = à l'intérieur)
    const distances = zoneCoords.map((vertex, i) => {
      const next = zoneCoords[(i + 1) % zoneCoords.length];
      return distanceToSegment(point, vertex, next);
    });
    return -Math.min(...distances); // Négatif = inside
  } else {
    // Distance à l'entrée la plus proche
    return distanceToPolygon(point, zoneCoords);
  }
};

// Distance point-segment
const distanceToSegment = (p, v, w) => {
  const l2 = (v.lat - w.lat)**2 + (v.lng - w.lng)**2;
  if (l2 === 0) return Math.hypot(p.lat - v.lat, p.lng - v.lng);
  
  let t = ((p.lat - v.lat) * (w.lat - v.lat) + (p.lng - v.lng) * (w.lng - v.lng)) / l2;
  t = Math.max(0, Math.min(1, t));
  
  return Math.hypot(
    p.lat - (v.lat + t * (w.lat - v.lat)),
    p.lng - (v.lng + t * (w.lng - v.lng))
  );
};