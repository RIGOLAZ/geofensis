// hooks/useGeofencing.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  doc,
  setDoc,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const ALERT_COOLDOWN = 30000; // 30 secondes entre alertes
const HYSTERESIS_MARGIN = 20; // 20 mètres de marge

export const useGeofencing = (zones, currentPosition, deviceId) => {
  // État interne dans useRef pour éviter les re-renders inutiles
  const zoneStatesRef = useRef(new Map());
  const lastAlertTimeRef = useRef(new Map());
  const alertKeysRef = useRef(new Set());
  
  // État React pour l'UI (zones actuellement violées)
  const [violatedZones, setViolatedZones] = useState([]);

  // Calcul distance Haversine
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const toRad = (x) => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  // Vérifier si point est dans zone avec hysteresis
  const isPointInZone = useCallback((position, zone, previousStatus) => {
    const distance = calculateDistance(
      position.lat, 
      position.lng, 
      zone.lat, 
      zone.lng
    );
    
    // Hysteresis : marge différente selon le sens de transition
    // Si on était dedans, on sort qu'à radius + marge
    // Si on était dehors, on rentre qu'à radius - marge
    let effectiveRadius = zone.radius;
    if (previousStatus === 'INSIDE') {
      effectiveRadius += HYSTERESIS_MARGIN;
    } else if (previousStatus === 'OUTSIDE') {
      effectiveRadius -= HYSTERESIS_MARGIN;
    }
    
    return distance <= Math.max(effectiveRadius, 10); // Minimum 10m
  }, [calculateDistance]);

  // Notification locale
  const sendLocalNotification = useCallback(async (title, body, data = {}) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { 
          title, 
          body, 
          data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH
        },
        trigger: null,
      });
    } catch (err) {
      console.error('Erreur notification:', err);
    }
  }, []);

  // 🛡️ CRÉER ALERTE DANS FIRESTORE AVEC PROTECTION ANTI-SPAM
  const createAlertInFirestore = useCallback(async (zone, type, position) => {
    if (!deviceId) {
      console.warn('Pas de deviceId, alerte non créée');
      return;
    }

    const now = Date.now();
    const alertKey = `${zone.id}_${deviceId}_${type}`;
    const lastAlertTime = lastAlertTimeRef.current.get(alertKey) || 0;
    
    // 🚫 Vérifier cooldown (30 secondes)
    if (now - lastAlertTime < ALERT_COOLDOWN) {
      console.log(`⏳ Cooldown actif pour ${zone.name} - ${type}`);
      return;
    }

    // 🚫 Vérifier si alerte identique existe déjà dans Firestore (5 dernières minutes)
    try {
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('zoneId', '==', zone.id),
        where('deviceId', '==', deviceId),
        where('type', '==', type),
        where('status', '==', 'active'),
        where('timestamp', '>', fiveMinutesAgo)
      );
      
      const existingAlerts = await getDocs(alertsQuery);
      
      if (!existingAlerts.empty) {
        console.log(`⚠️ Alerte ${type} existe déjà pour ${zone.name}`);
        lastAlertTimeRef.current.set(alertKey, now); // Mettre à jour le cooldown quand même
        return;
      }
    } catch (err) {
      console.error('Erreur vérification alertes existantes:', err);
      // Continuer malgré l'erreur (mieux vaut créer un doublon que manquer une alerte)
    }

    // ✅ Créer l'alerte
    try {
      const alertData = {
        zoneId: zone.id,
        zoneName: zone.name,
        deviceId: deviceId,
        type: type, // 'ZONE_EXIT' ou 'ZONE_ENTRY'
        status: 'active',
        timestamp: serverTimestamp(),
        position: {
          lat: position.lat,
          lng: position.lng,
          accuracy: position.accuracy || null
        },
        acknowledged: false
      };

      await addDoc(collection(db, 'alerts'), alertData);
      
      // Mettre à jour le cooldown
      lastAlertTimeRef.current.set(alertKey, now);
      
      // Sauvegarder l'état dans geofence_logs pour l'historique
      await addDoc(collection(db, 'geofence_logs'), {
        ...alertData,
        logType: 'transition'
      });

      console.log(`✅ Alerte ${type} créée pour ${zone.name}`);

    } catch (err) {
      console.error('Erreur création alerte:', err);
    }
  }, [deviceId]);

  // 🎯 LOGIQUE PRINCIPALE DE GEOFENCING
  useEffect(() => {
    if (!currentPosition || zones.length === 0 || !deviceId) return;

    const currentViolations = [];

    zones.forEach(zone => {
      // Récupérer l'état précédent
      const currentState = zoneStatesRef.current.get(zone.id) || {
        status: 'UNKNOWN',
        entryTime: null,
        lastPosition: null
      };

      // Vérifier si dans la zone
      const isInside = isPointInZone(currentPosition, zone, currentState.status);
      const newStatus = isInside ? 'INSIDE' : 'OUTSIDE';

      // 🎯 CHANGEMENT D'ÉTAT DÉTECTÉ
      if (newStatus !== currentState.status && currentState.status !== 'UNKNOWN') {
        console.log(`🔄 ${zone.name}: ${currentState.status} → ${newStatus}`);

        if (newStatus === 'OUTSIDE') {
          // SORTIE DE ZONE
          createAlertInFirestore(zone, 'ZONE_EXIT', currentPosition);
          sendLocalNotification(
            '🚨 ALERTE GEOFENCING',
            `Vous êtes sorti de la zone "${zone.name}" !`,
            { zoneId: zone.id, zoneName: zone.name, type: 'EXIT' }
          );
        } else {
          // ENTRÉE EN ZONE
          createAlertInFirestore(zone, 'ZONE_ENTRY', currentPosition);
          sendLocalNotification(
            '✅ Zone sécurisée',
            `Vous êtes entré dans la zone "${zone.name}"`,
            { zoneId: zone.id, zoneName: zone.name, type: 'ENTRY' }
          );
        }
      }

      // Mettre à jour l'état dans la ref
      zoneStatesRef.current.set(zone.id, {
        status: newStatus,
        entryTime: newStatus === 'INSIDE' ? Date.now() : currentState.entryTime,
        lastPosition: currentPosition
      });

      // Si hors zone, ajouter aux violations pour l'UI
      if (newStatus === 'OUTSIDE') {
        currentViolations.push({
          zoneId: zone.id,
          zoneName: zone.name,
          since: currentState.entryTime ? Date.now() - currentState.entryTime : null
        });
      }
    });

    // Mettre à jour l'état React pour l'affichage
    setViolatedZones(currentViolations);

  }, [currentPosition, zones, deviceId, isPointInZone, createAlertInFirestore, sendLocalNotification]);

  // Fonction pour forcer la vérification manuelle
  const checkNow = useCallback(() => {
    console.log('Vérification manuelle demandée');
    // Le useEffect se re-déclenchera si on change une dépendance
    // Ou tu peux exposer une ref pour forcer le check
  }, []);

  return {
    violatedZones,           // Zones actuellement violées (pour l'UI)
    zoneStates: zoneStatesRef.current, // État complet
    checkNow                 // Fonction de vérification manuelle
  };
};

export default useGeofencing;