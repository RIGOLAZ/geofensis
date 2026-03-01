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
    // Déjà chargé ?
    if (window.google?.maps?.Map) {
      console.log('✅ Google Maps déjà chargé');
      resolve(window.google);
      return;
    }

    // Vérifier si script existe déjà
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      console.log('⏳ Attente chargement script existant...');
      
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(checkLoaded);
          resolve(window.google);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkLoaded);
        if (window.google?.maps?.Map) {
          resolve(window.google);
        } else {
          reject(new Error('Timeout chargement Google Maps'));
        }
      }, 10000);
      
      return;
    }

    // ✅ NOUVEAU : Callback global pour loading=async
    window.__googleMapsCallback = () => {
      console.log('✅ Google Maps chargé (async)');
      delete window.__googleMapsCallback; // Nettoyer
      resolve(window.google);
    };

    console.log('🔄 Chargement Google Maps (async)...');
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // ✅ AJOUT de loading=async et callback
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=geometry,places&loading=async&v=weekly&language=fr&region=FR&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      delete window.__googleMapsCallback;
      reject(new Error('Échec chargement Google Maps'));
    };
    
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
          console.error('❌ Erreur Google Maps:', err);
          setState({ isLoaded: false, loadError: err, google: null });
        }
      });

    return () => { isMounted = false; };
  }, []);

  const initMap = useCallback((containerRef, options = {}) => {
    if (!state.google || !containerRef?.current) return null;
    
    const defaultOptions = {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 13,
      mapTypeId: 'hybrid',
      streetViewControl: false,
      fullscreenControl: false,
      ...options
    };
    
    return new state.google.maps.Map(containerRef.current, defaultOptions);
  }, [state.google]);

  return (
    <GoogleMapsContext.Provider value={{ ...state, initMap }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsContext;