// Encode une position en geohash
export const encodeGeohash = (latitude, longitude, precision = 9) => {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';
  let minLat = -90, maxLat = 90;
  let minLon = -180, maxLon = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (minLon + maxLon) / 2;
      if (longitude >= mid) {
        idx = idx * 2 + 1;
        minLon = mid;
      } else {
        idx = idx * 2;
        maxLon = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (latitude >= mid) {
        idx = idx * 2 + 1;
        minLat = mid;
      } else {
        idx = idx * 2;
        maxLat = mid;
      }
    }

    evenBit = !evenBit;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
};

// Calcule les geohash voisins pour requêtes spatiales
export const getNeighbors = (geohash) => {
  const neighbors = [];
  const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  // Simplifié - implémentation complète nécessaire
  return neighbors;
};
