// Configuration Google Maps - À importer dans tous les composants qui utilisent Google Maps
export const GOOGLE_MAPS_LIBRARIES = ['drawing', 'geometry', 'places'];

export const GOOGLE_MAPS_CONFIG = {
  id: 'google-maps-script',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  libraries: GOOGLE_MAPS_LIBRARIES,
  version: "weekly",
  language: "fr",
  region: "FR",
};

// Couleurs selon le niveau d'alerte
export const ALERT_COLORS = {
  high: '#f44336',    // Rouge
  medium: '#ff9800',  // Orange  
  low: '#4caf50',     // Vert
  default: '#2196f3', // Bleu
};

export const getAlertColor = (level) => ALERT_COLORS[level] || ALERT_COLORS.default;