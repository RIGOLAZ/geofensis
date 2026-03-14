import * as geolib from 'geolib';

export const predictBoundaryCrossing = (currentPoint, previousPoint, zone) => {
  const speed = geolib.getSpeed(
    {
      latitude: previousPoint.lat,
      longitude: previousPoint.lng,
      time: previousPoint.timestamp
    },
    {
      latitude: currentPoint.lat,
      longitude: currentPoint.lng,
      time: currentPoint.timestamp
    }
  );

  // Calculer distance à la zone selon le type
  let distanceToZone;
  if (zone.type === 'circle') {
    const center = { latitude: zone.center.lat, longitude: zone.center.lng };
    const distToCenter = geolib.getDistance(
      { latitude: currentPoint.lat, longitude: currentPoint.lng },
      center
    );
    distanceToZone = Math.abs(distToCenter - zone.radius);
  } else {
    // Pour polygone, distance minimale aux bords
    distanceToZone = getDistanceToPolygon(currentPoint, zone.coordinates);
  }

  const timeToBoundary = distanceToZone / (speed * 1000 / 3600); // conversion km/h en m/s

  return {
    willCross: timeToBoundary < 30, // Alerte 30s avant
    timeToBoundary,
    speed,
    distanceToZone
  };
};

const getDistanceToPolygon = (point, coordinates) => {
  let minDistance = Infinity;
  const coords = coordinates.map(c => ({ latitude: c.lat, longitude: c.lng }));
  const pt = { latitude: point.lat, longitude: point.lng };

  for (let i = 0; i < coords.length; i++) {
    const start = coords[i];
    const end = coords[(i + 1) % coords.length];
    const distance = geolib.getDistanceFromLine(pt, start, end);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
};