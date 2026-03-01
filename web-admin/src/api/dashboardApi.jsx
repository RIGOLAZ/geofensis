import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

export const getDashboardStats = async () => {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Compter les zones actives
    const zonesSnap = await getDocs(
      query(collection(db, 'zones'), where('active', '==', true))
    )

    // Compter les devices en ligne
    const devicesSnap = await getDocs(
      query(collection(db, 'devices'), where('status', '==', 'online'))
    )

    // Récupérer les logs d'aujourd'hui
    const logsSnap = await getDocs(
      query(
        collection(db, 'geofence_logs'),
        where('timestamp', '>=', Timestamp.fromDate(todayStart)),
        orderBy('timestamp', 'desc'),
        limit(100)
      )
    )

    // Compter les violations
    let violations = 0
    logsSnap.docs.forEach(doc => {
      const data = doc.data()
      if (data.type === 'ZONE_ENTRY' && data.authorized === false) {
        violations++
      }
    })

    return {
      totalZones: zonesSnap.size,
      activeDevices: devicesSnap.size,
      todayAlerts: logsSnap.size,
      violations: violations,
      lastUpdate: new Date()
    }
  } catch (error) {
    console.error('Error:', error)
    // Retourner des données par défaut si erreur
    return {
      totalZones: 0,
      activeDevices: 0,
      todayAlerts: 0,
      violations: 0,
      lastUpdate: new Date()
    }
  }
}

export const getRecentAlerts = async (limitCount = 10) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'geofence_logs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
    )
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        type: data.type,
        zoneId: data.zoneId,
        deviceId: data.deviceId,
        timestamp: data.timestamp?.toDate?.() || new Date(),
        location: data.location
      }
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return []
  }
}

export const getActivityData = async () => {
  // Pour l'instant, données simulées (à remplacer par vraies données agrégées)
  return [
    { name: '00:00', alerts: 0 },
    { name: '04:00', alerts: 0 },
    { name: '08:00', alerts: 0 },
    { name: '12:00', alerts: 0 },
    { name: '16:00', alerts: 0 },
    { name: '20:00', alerts: 0 },
  ]
}