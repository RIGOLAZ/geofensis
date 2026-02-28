// src/hooks/useGoogleMaps.js
import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/googleMaps';

let loaderInstance = null;
let isLoading = false;
let loadPromise = null;

export const useGoogleMaps = () => {
  const [google, setGoogle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si google est déjà chargé
    if (window.google?.maps) {
      setGoogle(window.google);
      return;
    }

    // Si un loader existe déjà, attendre la même promesse
    if (loaderInstance && loadPromise) {
      loadPromise
        .then(() => setGoogle(window.google))
        .catch(setError);
      return;
    }

    // Créer une nouvelle instance singleton
    if (!loaderInstance) {
      loaderInstance = new Loader(GOOGLE_MAPS_CONFIG);
      isLoading = true;
      
      loadPromise = loaderInstance.load()
        .then(() => {
          isLoading = false;
          return window.google;
        })
        .catch((err) => {
          isLoading = false;
          throw err;
        });
    }

    loadPromise
      .then((googleInstance) => setGoogle(googleInstance))
      .catch(setError);

  }, []);

  return { google, error, isLoading };
};