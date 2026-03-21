import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { doc, setDoc, collection, onSnapshot, getDocs, query, where } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import { db } from '../../config/firebase';

const LOCATION_TASK_NAME = 'background-location-task';

// Background task pour envoi position même quand app fermée
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  
  const { locations } = data;
  const location = locations[0];
  
  // Envoyer à Firestore
  await setDoc(doc(db, 'positions', global.workerId || 'test-worker'), {
    workerId: global.workerId || 'test-worker',
    workerName: global.workerName || 'Test Worker',
    deviceType: 'smartwatch-sim',
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    accuracy: location.coords.accuracy,
    altitude: location.coords.altitude,
    speed: location.coords.speed,
    timestamp: new Date(),
    battery: location.coords.batteryLevel,
    isMocked: location.mocked || false,
  });
});

class LocationService {
  constructor(workerId, workerName) {
    this.workerId = workerId;
    this.workerName = workerName;
    this.locationSubscription = null;
    this.zonesUnsubscribe = null;
    this.currentZone = null;
    this.zones = [];
    
    // Stocker globalement pour background task
    global.workerId = workerId;
    global.workerName = workerName;
  }

  // Démarrer le tracking
  async startTracking(options = {}) {
    const { 
      simulateMovement = false,  // Pour tester sans bouger
      testZoneId = null,         // ID d'une zone spécifique à tester
    } = options;

    // Permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      throw new Error('Permission localisation foreground refusée');
    }

    // Config notifications
    await this.setupNotifications();

    // Charger les zones d'abord
    await this.loadZones();

    if (simulateMovement && testZoneId) {
      // Mode simulation : génère des positions autour d'une zone
      this.startSimulation(testZoneId);
    } else {
      // Mode réel : GPS du téléphone
      this.startRealTracking();
    }

    console.log('✅ Tracking démarré', simulateMovement ? '(SIMULATION)' : '(RÉEL)');
  }

  // Tracking réel avec GPS
  async startRealTracking() {
    // Foreground tracking
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 3000,  // Toutes les 3 secondes
        distanceInterval: 2,  // Ou tous les 2 mètres
      },
      this.handleLocationUpdate.bind(this)
    );

    // Background tracking
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000,
      distanceInterval: 5,
      foregroundService: {
        notificationTitle: 'Geofensis Tracking',
        notificationBody: 'Envoi position en cours...',
        notificationColor: '#2196f3',
      },
    });
  }

  // Simulation de mouvement pour test
  async startSimulation(zoneId) {
    const zone = this.zones.find(z => z.id === zoneId);
    if (!zone) {
      console.error('Zone non trouvée pour simulation');
      return;
    }

    console.log('🎮 Démarrage simulation autour de:', zone.name);

    // Points de simulation : centre → extérieur → centre
    const simulationPoints = this.generateSimulationPoints(zone);
    let pointIndex = 0;

    this.simulationInterval = setInterval(async () => {
      const point = simulationPoints[pointIndex % simulationPoints.length];
      
      await this.handleLocationUpdate({
        coords: {
          latitude: point.lat,
          longitude: point.lng,
          accuracy: 5,
          altitude: 0,
          speed: 1.5,
          batteryLevel: 0.85,
          mocked: true,
        }
      });

      pointIndex++;
    }, 3000); // Change position toutes les 3 secondes
  }

  // Générer points de simulation (entrée/sortie zone)
  generateSimulationPoints(zone) {
    const points = [];
    
    if (zone.type === 'circle') {
      const center = zone.center;
      const radius = zone.radius;
      
      // Point 1: À 200m du centre (hors zone)
      points.push(this.offsetCoordinate(center, 200, 0));
      
      // Point 2: À 100m du centre (hors zone)
      points.push(this.offsetCoordinate(center, 100, 90));
      
      // Point 3: À 50m du centre (hors zone)
      points.push(this.offsetCoordinate(center, 50, 180));
      
      // Point 4: Dans la zone (rayon/2)
      points.push(this.offsetCoordinate(center, radius * 0.3, 270));
      
      // Point 5: Au centre
      points.push(center);
      
      // Point 6: Dans la zone
      points.push(this.offsetCoordinate(center, radius * 0.4, 45));
      
      // Point 7: Sortie (rayon + 50m)
      points.push(this.offsetCoordinate(center, radius + 50, 135));
      
      // Point 8: Loin (hors zone)
      points.push(this.offsetCoordinate(center, radius + 200, 225));
      
    } else if (zone.type === 'polygon') {
      // Centroid approximatif du polygone
      const centroid = this.calculateCentroid(zone.coordinates);
      
      // Point hors zone (200m au nord)
      points.push(this.offsetCoordinate(centroid, 200, 0));
      
      // Points vers l'intérieur
      points.push(this.offsetCoordinate(centroid, 100, 90));
      points.push(this.offsetCoordinate(centroid, 50, 180));
      
      // Point dans la zone (centroid)
      points.push(centroid);
      
      // Sortie
      points.push(this.offsetCoordinate(centroid, 200, 270));
    }
    
    return points;
  }

  // Décaler une coordonnée (distance en mètres, angle en degrés)
  offsetCoordinate(coord, distanceMeters, angleDegrees) {
    const earthRadius = 6371000; // mètres
    const angleRad = angleDegrees * (Math.PI / 180);
    
    const latRad = coord.lat * (Math.PI / 180);
    const lngRad = coord.lng * (Math.PI / 180);
    
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distanceMeters / earthRadius) +
      Math.cos(latRad) * Math.sin(distanceMeters / earthRadius) * Math.cos(angleRad)
    );
    
    const newLngRad = lngRad + Math.atan2(
      Math.sin(angleRad) * Math.sin(distanceMeters / earthRadius) * Math.cos(latRad),
      Math.cos(distanceMeters / earthRadius) - Math.sin(latRad) * Math.sin(newLatRad)
    );
    
    return {
      lat: newLatRad * (180 / Math.PI),
      lng: newLngRad * (180 / Math.PI)
    };
  }

  // Calculer centroid d'un polygone
  calculateCentroid(coordinates) {
    let lat = 0, lng = 0;
    coordinates.forEach(coord => {
      lat += coord.lat;
      lng += coord.lng;
    });
    return {
      lat: lat / coordinates.length,
      lng: lng / coordinates.length
    };
  }

  // Arrêter le tracking
  stopTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
    if (this.zonesUnsubscribe) {
      this.zonesUnsubscribe();
    }
    console.log('🛑 Tracking arrêté');
  }

  // Charger les zones
  async loadZones() {
    const snapshot = await getDocs(collection(db, 'zones'));
    this.zones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Écouter les changements en temps réel
    this.zonesUnsubscribe = onSnapshot(collection(db, 'zones'), (snap) => {
      this.zones = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  }

  // Mise à jour position
  async handleLocationUpdate(location) {
    const { latitude, longitude, accuracy, altitude, speed, batteryLevel, mocked } = location.coords;
    
    const positionData = {
      workerId: this.workerId,
      workerName: this.workerName,
      deviceType: mocked ? 'smartwatch-sim' : 'smartwatch',
      lat: latitude,
      lng: longitude,
      accuracy,
      altitude: altitude || null,
      speed: speed || 0,
      timestamp: new Date(),
      battery: batteryLevel ? Math.round(batteryLevel * 100) : null,
      isMocked: mocked || false,
    };

    // Envoyer position
    await setDoc(doc(db, 'positions', this.workerId), positionData);
    
    // Mettre à jour historique (pour traçage)
    await setDoc(doc(collection(db, 'positions', this.workerId, 'history')), {
      ...positionData,
      recordedAt: new Date(),
    });

    // Vérifier géofencing
    this.checkGeofencing(latitude, longitude);
  }

  // Vérifier si dans une zone
  checkGeofencing(lat, lng) {
    this.zones.forEach(zone => {
      const isInside = this.isPointInZone(lat, lng, zone);
      
      // Détection entrée
      if (isInside && this.currentZone !== zone.id) {
        this.currentZone = zone.id;
        this.triggerAlert(zone, 'entry', { lat, lng });
      }
      
      // Détection sortie
      else if (!isInside && this.currentZone === zone.id) {
        this.currentZone = null;
        this.triggerAlert(zone, 'exit', { lat, lng });
      }
    });
  }

  isPointInZone(lat, lng, zone) {
    if (zone.type === 'circle') {
      const distance = this.getDistanceFromLatLonInM(lat, lng, zone.center.lat, zone.center.lng);
      return distance <= zone.radius;
    } else {
      return this.isPointInPolygon(lat, lng, zone.coordinates);
    }
  }

  getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  isPointInPolygon(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Déclencher alerte
  async triggerAlert(zone, type, position) {
    const message = type === 'entry' 
      ? (zone.entryMessage || `⚠️ Entrée dans ${zone.name}`)
      : (zone.exitMessage || `✅ Sortie de ${zone.name}`);

    // Notification locale immédiate
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Zone ${zone.name}`,
        body: message,
        sound: zone.soundAlert ? 'default' : null,
        data: { 
          zoneId: zone.id, 
          type,
          position,
          timestamp: new Date().toISOString(),
        },
      },
      trigger: null,
    });

    // Créer alerte dans Firestore (déclenche SMS via Cloud Function)
    await setDoc(doc(collection(db, 'alerts')), {
      workerId: this.workerId,
      workerName: this.workerName,
      zoneId: zone.id,
      zoneName: zone.name,
      zoneAlertLevel: zone.alertLevel,
      type: type,
      position: position,
      timestamp: new Date(),
      smsAlert: zone.smsAlert || false,
      contactPhone: zone.contactPhone || null,
      smsSent: false,
      entryMessage: zone.entryMessage,
      exitMessage: zone.exitMessage,
    });
  }

  async setupNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permission notifications refusée');
    }
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
}

export default LocationService;