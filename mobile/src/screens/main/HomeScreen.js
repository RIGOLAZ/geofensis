import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Switch } from 'react-native';
import MapView, { Circle, Polygon, Marker } from 'react-native-maps';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import LocationService from '../services/locationService';

export default function HomeScreen({ route }) {
  const { workerId, workerName } = route.params;
  const [isTracking, setIsTracking] = useState(false);
  const [zones, setZones] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const locationService = useRef(new LocationService(workerId, workerName)).current;

  useEffect(() => {
    // Charger les zones
    const unsubscribe = onSnapshot(collection(db, 'zones'), (snapshot) => {
      const zonesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setZones(zonesData);
    });

    return () => unsubscribe();
  }, []);

  const toggleTracking = async () => {
    if (isTracking) {
      locationService.stopTracking();
      setIsTracking(false);
    } else {
      try {
        await locationService.startTracking();
        setIsTracking(true);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        followsUserLocation={isTracking}
      >
        {/* Afficher les zones */}
        {zones.map(zone => {
          if (zone.type === 'circle') {
            return (
              <Circle
                key={zone.id}
                center={zone.center}
                radius={zone.radius}
                fillColor={`${getAlertColor(zone.alertLevel)}33`}
                strokeColor={getAlertColor(zone.alertLevel)}
                strokeWidth={2}
              />
            );
          } else {
            return (
              <Polygon
                key={zone.id}
                coordinates={zone.coordinates}
                fillColor={`${getAlertColor(zone.alertLevel)}33`}
                strokeColor={getAlertColor(zone.alertLevel)}
                strokeWidth={2}
              />
            );
          }
        })}
      </MapView>

      <View style={styles.controls}>
        <Text style={styles.title}>Géofensis Worker</Text>
        <Text>{workerName} ({workerId})</Text>
        
        <View style={styles.trackingRow}>
          <Text>Tracking GPS</Text>
          <Switch
            value={isTracking}
            onValueChange={toggleTracking}
          />
        </View>

        {isTracking && (
          <Text style={styles.status}>✅ En tracking...</Text>
        )}
      </View>
    </View>
  );
}

const getAlertColor = (level) => {
  switch (level) {
    case 'high': return '#f44336';
    case 'medium': return '#ff9800';
    case 'low': return '#4caf50';
    default: return '#2196f3';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  trackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  status: { color: 'green', marginTop: 5 },
});