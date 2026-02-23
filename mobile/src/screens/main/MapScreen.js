import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Polygon, Circle, Marker } from 'react-native-maps';
import { FAB, Card, Text, Badge } from 'react-native-paper';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [zones, setZones] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    let locationSubscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          setLocation(newLocation.coords);
        }
      );
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const getZoneColor = (zone) => {
    switch (zone.alertLevel) {
      case 'high':
        return 'rgba(244, 67, 54, 0.3)';
      case 'medium':
        return 'rgba(255, 152, 0, 0.3)';
      default:
        return 'rgba(76, 175, 80, 0.3)';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation
        followsUserLocation
        initialRegion={{
          latitude: location?.latitude || 48.8566,
          longitude: location?.longitude || 2.3522,
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
                fillColor={getZoneColor(zone)}
                strokeColor={zone.color || '#F44336'}
                strokeWidth={2}
              />
            ) : (
              <Polygon
                coordinates={zone.coordinates.map((c) => ({
                  latitude: c.lat,
                  longitude: c.lng,
                }))}
                fillColor={getZoneColor(zone)}
                strokeColor={zone.color || '#F44336'}
                strokeWidth={2}
              />
            )}
          </React.Fragment>
        ))}
      </MapView>

      {activeAlerts.length > 0 && (
        <Card style={styles.alertsCard}>
          <Card.Title
            title={`${activeAlerts.length} Alertes`}
            left={() => (
              <Badge style={{ backgroundColor: 'red' }}>
                {activeAlerts.length}
              </Badge>
            )}
          />
        </Card>
      )}

      <View style={styles.fabContainer}>
        <FAB icon="layers" style={styles.fab} onPress={() => {}} />
        <FAB icon="crosshairs-gps" style={styles.fab} onPress={() => {}} />
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          GPS: {location ? 'Actif' : 'Recherche...'} | Précision:{' '}
          {location?.accuracy?.toFixed(1)}m
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  alertsCard: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    elevation: 4,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
  },
  fab: {
    marginBottom: 8,
  },
  statusBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
  },
});