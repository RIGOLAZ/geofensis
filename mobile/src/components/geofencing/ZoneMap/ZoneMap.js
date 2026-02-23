import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Polygon, Circle, Marker } from 'react-native-maps';

const ZoneMap = ({ zones, userLocation, onZonePress }) => {
  const getZoneColor = (alertLevel) => {
    switch (alertLevel) {
      case 'high':
        return 'rgba(244, 67, 54, 0.3)';
      case 'medium':
        return 'rgba(255, 152, 0, 0.3)';
      default:
        return 'rgba(76, 175, 80, 0.3)';
    }
  };

  return (
    <MapView
      style={styles.map}
      showsUserLocation
      followsUserLocation
      initialRegion={{
        latitude: userLocation?.latitude || 48.8566,
        longitude: userLocation?.longitude || 2.3522,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {zones.map((zone) => (
        <React.Fragment key={zone.id}>
          {zone.type === 'circle' ? (
            <Circle
              center={{
                latitude: zone.center.lat,
                longitude: zone.center.lng,
              }}
              radius={zone.radius}
              fillColor={getZoneColor(zone.alertLevel)}
              strokeColor={zone.color || '#F44336'}
              strokeWidth={2}
              onPress={() => onZonePress?.(zone)}
            />
          ) : (
            <Polygon
              coordinates={zone.coordinates.map((c) => ({
                latitude: c.lat,
                longitude: c.lng,
              }))}
              fillColor={getZoneColor(zone.alertLevel)}
              strokeColor={zone.color || '#F44336'}
              strokeWidth={2}
              onPress={() => onZonePress?.(zone)}
            />
          )}
          <Marker
            coordinate={{
              latitude: zone.center?.lat || zone.coordinates[0]?.lat,
              longitude: zone.center?.lng || zone.coordinates[0]?.lng,
            }}
            title={zone.name}
            description={zone.description}
            onPress={() => onZonePress?.(zone)}
          />
        </React.Fragment>
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default ZoneMap;