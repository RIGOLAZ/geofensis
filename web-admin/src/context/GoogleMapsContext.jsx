import React, { createContext, useContext, useState, useEffect } from 'react';

const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: null,
  google: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

// Configuration centralisée - MÊME configuration partout dans l'app
const GOOGLE_MAPS_LIBRARIES = ['drawing', 'geometry', 'places'];
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Singleton pour éviter les chargements multiples
let loadPromise = null;
let isLoading = false;

const loadGoogleMapsScript = () => {
  if (typeof window === 'undefined') return Promise.reject('Window not available');
  
  // Déjà chargé avec toutes les librairies ?
  if (window.google && window.google.maps && window.google.maps.drawing) {
    console.log('✅ Google Maps déjà chargé avec drawing');
    return Promise.resolve(window.google);
  }

  // Si déjà en cours de chargement, attendre
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    // Vérifier si un script existe déjà mais sans toutes les librairies
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    if (existingScript) {
      console.log('⏳ Script existant détecté, attente du chargement...');
      
      // Vérifier toutes les 100ms si les librairies sont disponibles
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.drawing) {
          clearInterval(checkInterval);
          isLoading = false;
          resolve(window.google);
        }
      }, 100);
      
      // Timeout après 10 secondes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google && window.google.maps && window.google.maps.drawing) {
          isLoading = false;
          resolve(window.google);
        } else {
          isLoading = false;
          reject(new Error('Timeout: drawing library not available'));
        }
      }, 10000);
      
      return;
    }

    // Créer le script avec TOUTES les librairies nécessaires
    console.log('🔄 Chargement Google Maps avec libraries:', GOOGLE_MAPS_LIBRARIES);
    
    const script = document.createElement('script');
    const librariesParam = GOOGLE_MAPS_LIBRARIES.join(',');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${librariesParam}&v=weekly&language=fr&region=FR`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';
    
    script.onload = () => {
      console.log('✅ Google Maps chargé avec succès');
      isLoading = false;
      resolve(window.google);
    };
    
    script.onerror = (err) => {
      console.error('❌ Erreur chargement Google Maps:', err);
      isLoading = false;
      reject(new Error('Failed to load Google Maps'));
    };
    
    document.head.appendChild(script);
  });
  
  return loadPromise;
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
          setState({
            isLoaded: true,
            loadError: null,
            google: google,
          });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setState({
            isLoaded: false,
            loadError: err,
            google: null,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <GoogleMapsContext.Provider value={state}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsContext;