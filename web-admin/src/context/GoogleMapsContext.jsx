import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: null,
  google: null,
  initMap: () => null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

// ✅ Chargement async moderne
const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.Map) {
      resolve(window.google);
      return;
    }

    // Vérifie si déjà en cours de chargement
    if (document.querySelector('script[src*="maps.googleapis"]')) {
      const check = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(check);
          resolve(window.google);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        reject(new Error('Timeout loading Google Maps'));
      }, 30000);
      return;
    }

    // Crée le script avec loading=async
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=marker,geometry,places&loading=async&v=weekly&language=fr&region=FR`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    
    document.head.appendChild(script);
  });
};

export const GoogleMapsProvider = ({ children }) => {
  const [state, setState] = useState({
    isLoaded: false,
    loadError: null,
    google: null,
  });

  useEffect(() => {
    let isMounted = true;
    
    loadGoogleMapsScript()
      .then((google) => {
        if (isMounted) {
          setState({ isLoaded: true, loadError: null, google });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setState({ isLoaded: false, loadError: err, google: null });
        }
      });
      
    return () => { isMounted = false; };
  }, []);

  const initMap = useCallback((containerRef, options = {}) => {
    if (!state.google || !containerRef?.current) return null;
    
    const map = new state.google.maps.Map(containerRef.current, {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 13,
      mapTypeId: 'hybrid',
      streetViewControl: false,
      fullscreenControl: false,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID', // ✅ Nécessaire pour AdvancedMarker
      ...options
    });
    
    return map;
  }, [state.google]);

  return (
    <GoogleMapsContext.Provider value={{ ...state, initMap }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};