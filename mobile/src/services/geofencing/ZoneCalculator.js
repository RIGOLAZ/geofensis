import * as geolib from 'geolib';

export const calculateDistance = (point1, point2) => {
  return geolib.getDistance(
    { latitude: point1.lat, longitude: point1.lng },
    { latitude: point2.lat, longitude: point2.lng }
  );
};

export const calculateCenter = (coordinates) => {
  return geolib.getCenter(coordinates.map(c => ({
    latitude: c.lat,
    longitude: c.lng
  })));
};

export const calculateArea = (coordinates) => {
  return geolib.getAreaOfPolygon(coordinates.map(c => ({
    latitude: c.lat,
    longitude: c.lng
  })));
};

export const getBoundingBox = (coordinates) => {
  return geolib.getBounds(coordinates.map(c => ({
    latitude: c.lat,
    longitude: c.lng
  })));
};