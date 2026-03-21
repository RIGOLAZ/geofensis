import * as Notifications from 'expo-notifications';
import * as SMS from 'expo-sms';
import { Audio } from 'expo-audio';
import * as Application from 'expo-application';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { isPointInZone, getDistanceToBoundary, predictBoundaryCrossing } from '../../utils/geospatial/polygons';

class GeofenceService {
  constructor() {
    this.zones = new Map();
    this.deviceStatus = new Map();
    this.sound = null;
    this.unsubscribe = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    // Charger le son d'alerte
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/alert-high.mp3')
      );
      this.sound = sound;
    } catch (error) {
      console.log('Audio load error:', error);
    }

    // Écouter les zones actives en temps réel
    this.subscribeToZones();
    this.initialized = true;
  }

  subscribeToZones() {
    const q = query(
      collection(db, 'zones'),
      where('active', '==', true)
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const zone = { id: change.doc.id, ...change.doc.data() };
        
        if (change.type === 'added' || change.type === 'modified') {
          this.addZone(zone); // Appel de la nouvelle méthode
        } else if (change.type === 'removed') {
          this.zones.delete(zone.id);
        }
      });
    });
  }

  // ✅ Nouvelle méthode addZone
  addZone(zone) {
    this.zones.set(zone.id, {
      ...zone,
      lastStatus: false,
      entryTime: null,
      exitTime: null,
      previousPoint: null,
    });
  }

  async checkLocation(location) {
    const point = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: Date.now(),
    };

    for (const [zoneId, zone] of this.zones) {
      const isInside = isPointInZone(point.latitude, point.longitude, zone);
      const previousStatus = zone.lastStatus;

      // Détection d'entrée
      if (isInside && !previousStatus) {
        await this.handleZoneEntry(zone, point);
      }
      // Détection de sortie
      else if (!isInside && previousStatus) {
        await this.handleZoneExit(zone, point);
      }
      // Alerte prédictive
      else if (!isInside && zone.previousPoint && zone.predictiveAlerts) {
        const prediction = predictBoundaryCrossing(point, zone.previousPoint, zone);
        if (prediction.willCross) {
          await this.sendPredictiveAlert(zone, prediction);
        }
      }

      // Mise à jour du statut
      zone.lastStatus = isInside;
      zone.previousPoint = point;
    }
  }

  async handleZoneEntry(zone, point) {
    zone.entryTime = new Date();

    // Notification locale
    await this.sendLocalNotification({
      title: `🚨 Entrée: ${zone.name}`,
      body: zone.entryMessage || `Vous êtes entré dans ${zone.name}`,
      data: { type: 'ENTER', zoneId: zone.id, timestamp: point.timestamp },
      priority: 'high',
    });

    // SMS si configuré
    if (zone.smsAlert && zone.contactPhone) {
      await this.sendSMS(zone.contactPhone, `ALERTE: Entrée dans ${zone.name}`);
    }

    // Son d'alerte
    if (zone.soundAlert) {
      await this.playAlertSound();
    }

    // Log dans Firestore
    await this.logEvent('ZONE_ENTRY', zone, point);
  }

  async handleZoneExit(zone, point) {
    const duration = zone.entryTime ? Date.now() - zone.entryTime.getTime() : 0;

    await this.sendLocalNotification({
      title: `✅ Sortie: ${zone.name}`,
      body: `Durée: ${Math.floor(duration / 60000)} min`,
      data: { type: 'EXIT', zoneId: zone.id, duration },
    });

    await this.logEvent('ZONE_EXIT', zone, point, { duration });
  }

  async sendLocalNotification({ title, body, data, priority = 'default' }) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }

  async sendSMS(phoneNumber, message) {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync([phoneNumber], message);
    }
  }

  async playAlertSound() {
    if (this.sound) {
      try {
        // ✅ Stop et reset avant de rejouer
        await this.sound.stopAsync();
        await this.sound.setPositionAsync(0);
        await this.sound.playAsync();
      } catch (error) {
        console.log('Sound play error:', error);
      }
    }
  }

  async logEvent(type, zone, location, metadata = {}) {
    try {
      // ✅ Utilisation correcte de deviceId
      const deviceId = Application.androidId || 
                       Application.getIosIdForVendorAsync() || 
                       'unknown';

      await addDoc(collection(db, 'geofence_logs'), {
        type,
        zoneId: zone.id,
        zoneName: zone.name,
        deviceId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
        timestamp: serverTimestamp(),
        ...metadata,
      });
    } catch (error) {
      console.error('Log error:', error);
    }
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.sound) {
      this.sound.unloadAsync();
    }
    this.zones.clear();
    this.initialized = false;
  }
}

export default new GeofenceService();