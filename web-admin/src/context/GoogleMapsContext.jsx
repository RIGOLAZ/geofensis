// context/GoogleMapsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMapsContext = createContext();

export const GoogleMapsProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      // 🎯 TOUTES les bibliothèques nécessaires
      libraries: ['places', 'drawing', 'geometry', 'marker'],
    });

    loader
      .load()
      .then(() => {
        console.log('✅ Google Maps chargé avec toutes les libs');
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('❌ Erreur chargement Google Maps:', err);
        setLoadError(err);
      });
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps doit être utilisé dans GoogleMapsProvider');
  }
  return context;
};