import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: null,
  google: null,
  initMap: () => null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.Map) {
      resolve(window.google);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      const check = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(check);
          resolve(window.google);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        window.google?.maps?.Map ? resolve(window.google) : reject(new Error('Timeout'));
      }, 10000);
      return;
    }

    window.__googleMapsCallback = () => {
      delete window.__googleMapsCallback;
      resolve(window.google);
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // ✅ AJOUT de la bibliothèque 'marker' pour AdvancedMarkerElement
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=geometry,places,marker&v=weekly&language=fr&region=FR&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Échec chargement'));
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
      .then((google) => isMounted && setState({ isLoaded: true, loadError: null, google }))
      .catch((err) => isMounted && setState({ isLoaded: false, loadError: err, google: null }));
    return () => { isMounted = false; };
  }, []);

  const initMap = useCallback((containerRef, options = {}) => {
    if (!state.google || !containerRef?.current) return null;
    return new state.google.maps.Map(containerRef.current, {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 13,
      mapTypeId: 'hybrid',
      streetViewControl: false,
      fullscreenControl: false,
      ...options
    });
  }, [state.google]);

  return (
    <GoogleMapsContext.Provider value={{ ...state, initMap }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};