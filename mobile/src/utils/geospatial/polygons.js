import * as geolib from 'geolib';

/**
 * Vérifie si un point est dans une zone (cercle ou polygone)
 */
export function isPointInZone(lat, lng, zone) {
  const point = { latitude: lat, longitude: lng };

  if (zone.type === 'circle') {
    const center = { latitude: zone.center.lat, longitude: zone.center.lng };
    const distance = geolib.getDistance(point, center);
    return distance <= zone.radius;
  }

  if (zone.type === 'polygon') {
    return geolib.isPointInPolygon(
      point,
      zone.coordinates.map((c) => ({ latitude: c.lat, longitude: c.lng }))
    );
  }

  return false;
}

/**
 * Calcule la distance jusqu'à la frontière la plus proche
 */
export function getDistanceToBoundary(point, zone) {
  if (zone.type === 'circle') {
    const center = { latitude: zone.center.lat, longitude: zone.center.lng };
    const distanceToCenter = geolib.getDistance(point, center);
    return Math.abs(distanceToCenter - zone.radius);
  }

  if (zone.type === 'polygon') {
    let minDistance = Infinity;
    const coords = zone.coordinates;

    for (let i = 0; i < coords.length; i++) {
      const start = coords[i];
      const end = coords[(i + 1) % coords.length];

      const distance = geolib.getDistanceFromLine(
        point,
        { latitude: start.lat, longitude: start.lng },
        { latitude: end.lat, longitude: end.lng }
      );

      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  return Infinity;
}

/**
 * Algorithme Ray Casting pour polygones complexes
 */
export function isPointInPolygon(point, polygon) {
  let inside = false;
  let j = polygon.length - 1;

  for (let i = 0; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude,
      yi = polygon[i].latitude;
    const xj = polygon[j].longitude,
      yj = polygon[j].latitude;

    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Prédit le franchissement de frontière
 */
export function predictBoundaryCrossing(currentPoint, previousPoint, zone) {
  const speed = geolib.getSpeed(
    {
      latitude: previousPoint.latitude,
      longitude: previousPoint.longitude,
      time: previousPoint.timestamp,
    },
    {
      latitude: currentPoint.latitude,
      longitude: currentPoint.longitude,
      time: currentPoint.timestamp,
    }
  );

  const distanceToZone = getDistanceToBoundary(currentPoint, zone);
  const timeToBoundary = distanceToZone / ((speed * 1000) / 3600); // Conversion km/h en m/s

  return {
    willCross: timeToBoundary < 30, // Alerte 30 secondes avant
    timeToBoundary,
    speed,
  };
}