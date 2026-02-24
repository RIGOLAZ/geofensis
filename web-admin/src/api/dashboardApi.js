import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'

// Récupérer les statistiques globales du dashboard
export const getDashboardStats = async () => {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Compter les zones actives
    const zonesSnapshot = await getDocs(
      query(collection(db, 'zones'), where('active', '==', true))
    )
    
    // Compter les devices en ligne
    const devicesSnapshot = await getDocs(
      query(collection(db, 'devices'), where('status', '==', 'online'))
    )
    
    // Compter les alertes aujourd'hui
    const todayLogsSnapshot = await getDocs(
      query(
        collection(db, 'geofence_logs'),
        where('timestamp', '>=', todayStart),
        orderBy('timestamp', 'desc')
      )
    )
    
    // Compter les violations (entrées non autorisées)
    const violationsSnapshot = await getDocs(
      query(
        collection(db, 'geofence_logs'),
        where('type', '==', 'ZONE_ENTRY'),
        where('timestamp', '>=', todayStart),
        where('authorized', '==', false)
      )
    )
    
    return {
      totalZones: zonesSnapshot.size,
      activeDevices: devicesSnapshot.size,
      todayAlerts: todayLogsSnapshot.size,
      violations: violationsSnapshot.size,
      lastUpdate: new Date()
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

// Récupérer les données pour le graphique d'activité
export const getActivityData = async (period = '24h') => {
  try {
    const now = new Date()
    let intervals = []
    let dataPoints = []
    
    if (period === '24h') {
      // Dernières 24 heures par heure
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now - i * 60 * 60 * 1000)
        intervals.push({
          start: new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours()),
          end: new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours() + 1),
          label: `${hour.getHours()}:00`
        })
      }
    } else if (period === '7d') {
      // 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now - i * 24 * 60 * 60 * 1000)
        intervals.push({
          start: new Date(day.getFullYear(), day.getMonth(), day.getDate()),
          end: new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1),
          label: day.toLocaleDateString('fr-FR', { weekday: 'short' })
        })
      }
    }
    
    // Récupérer les logs pour chaque intervalle
    for (const interval of intervals) {
      const snapshot = await getDocs(
        query(
          collection(db, 'geofence_logs'),
          where('timestamp', '>=', interval.start),
          where('timestamp', '<', interval.end)
        )
      )
      
      dataPoints.push({
        name: interval.label,
        alerts: snapshot.size,
        entries: snapshot.docs.filter(d => d.data().type === 'ZONE_ENTRY').length,
        exits: snapshot.docs.filter(d => d.data().type === 'ZONE_EXIT').length
      })
    }
    
    return dataPoints
  } catch (error) {
    console.error('Error fetching activity data:', error)
    throw error
  }
}

// Récupérer les données pour la heatmap
export const getHeatmapData = async (zoneId = null, hours = 24) => {
  try {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    let q = query(
      collection(db, 'geofence_logs'),
      where('timestamp', '>=', startTime),
      where('type', '==', 'ZONE_ENTRY')
    )
    
    if (zoneId) {
      q = query(q, where('zoneId', '==', zoneId))
    }
    
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0,
        weight: 1,
        timestamp: data.timestamp?.toDate()
      }
    })
  } catch (error) {
    console.error('Error fetching heatmap data:', error)
    throw error
  }
}

// Récupérer les alertes récentes pour le dashboard
export const getRecentAlerts = async (limit = 10) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'geofence_logs'),
        orderBy('timestamp', 'desc'),
        limit(limit)
      )
    )
    
    const alerts = []
    for (const doc of snapshot.docs) {
      const data = doc.data()
      
      // Récupérer les infos de la zone
      let zoneName = data.zoneId
      try {
        const zoneDoc = await getDoc(doc(db, 'zones', data.zoneId))
        if (zoneDoc.exists()) {
          zoneName = zoneDoc.data().name
        }
      } catch (e) {}
      
      alerts.push({
        id: doc.id,
        type: data.type,
        zoneId: data.zoneId,
        zoneName,
        deviceId: data.deviceId,
        timestamp: data.timestamp?.toDate(),
        location: data.location
      })
    }
    
    return alerts
  } catch (error) {
    console.error('Error fetching recent alerts:', error)
    throw error
  }
}

// Récupérer les métriques de performance
export const getPerformanceMetrics = async () => {
  try {
    // Temps de réponse moyen des notifications
    // Taux de succès des deliveries
    // Précision GPS moyenne
    
    const recentLogs = await getDocs(
      query(
        collection(db, 'geofence_logs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      )
    )
    
    const logs = recentLogs.docs.map(d => d.data())
    
    return {
      avgResponseTime: logs.reduce((acc, log) => acc + (log.processingTime || 0), 0) / logs.length,
      deliverySuccessRate: logs.filter(l => l.notificationDelivered).length / logs.length * 100,
      avgGpsAccuracy: logs.reduce((acc, log) => acc + (log.location?.accuracy || 0), 0) / logs.length,
      totalEvents: logs.length
    }
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    throw error
  }
}

// Générer un rapport PDF (via Cloud Function)
export const generateReport = async (type, dateRange) => {
  try {
    const response = await fetch('/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, dateRange })
    })
    
    return await response.json()
  } catch (error) {
    console.error('Error generating report:', error)
    throw error
  }
}
