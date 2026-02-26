import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const LIBRARIES = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '350px'
};

const center = {
  lat: 48.8566,
  lng: 2.3522
};

function RealTimeMap({ devices = [] }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const onLoad = useCallback((map) => {
    console.log('Map loaded');
  }, []);

  if (loadError) {
    return <div style={{color: 'red'}}>Erreur chargement carte: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Chargement de la carte...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
      onLoad={onLoad}
    >
      {devices.map((device) => (
        <Marker
          key={device.id}
          position={{ lat: device.lat || center.lat, lng: device.lng || center.lng }}
          title={device.name || device.id}
        />
      ))}
    </GoogleMap>
  );
}

export default React.memo(RealTimeMap);