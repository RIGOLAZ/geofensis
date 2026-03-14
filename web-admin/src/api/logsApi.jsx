import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

const LOGS_COLLECTION = 'geofence_logs'

// Récupérer les logs avec pagination
export const getLogs = async (filters = {}, lastDoc = null, pageSize = 50) => {
  try {
    let q = query(
      collection(db, LOGS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    )
    
    // Appliquer les filtres
    if (filters.zoneId) {
      q = query(q, where('zoneId', '==', filters.zoneId))
    }
    if (filters.deviceId) {
      q = query(q, where('deviceId', '==', filters.deviceId))
    }
    if (filters.type) {
      q = query(q, where('type', '==', filters.type))
    }
    if (filters.startDate && filters.endDate) {
      q = query(q, 
        where('timestamp', '>=', filters.startDate),
        where('timestamp', '<=', filters.endDate)
      )
    }
    
    // Pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    const snapshot = await getDocs(q)
    return {
      logs: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === pageSize
    }
  } catch (error) {
    console.error('Error fetching logs:', error)
    throw error
  }
}

// Souscrire aux logs en temps réel
export const subscribeToLogs = (callback, limit = 100) => {
  const q = query(
    collection(db, LOGS_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(limit)
  )
  
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }))
    callback(logs)
  })
}

// Récupérer les statistiques des alertes
export const getAlertStats = async (period = '24h') => {
  try {
    const now = new Date()
    let startTime
    
    switch(period) {
      case '1h':
        startTime = new Date(now - 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(now - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startTime = new Date(now - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now - 24 * 60 * 60 * 1000)
    }
    
    const q = query(
      collection(db, LOGS_COLLECTION),
      where('timestamp', '>=', startTime),
      orderBy('timestamp', 'desc')
    )
    
    const snapshot = await getDocs(q)
    const logs = snapshot.docs.map(doc => doc.data())
    
    return {
      total: logs.length,
      entries: logs.filter(l => l.type === 'ZONE_ENTRY').length,
      exits: logs.filter(l => l.type === 'ZONE_EXIT').length,
      byZone: logs.reduce((acc, log) => {
        acc[log.zoneId] = (acc[log.zoneId] || 0) + 1
        return acc
      }, {}),
      byHour: logs.reduce((acc, log) => {
        const hour = log.timestamp?.toDate().getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {})
    }
  } catch (error) {
    console.error('Error fetching alert stats:', error)
    throw error
  }
}

// Exporter les logs
export const exportLogs = async (format = 'json', filters = {}) => {
  try {
    const { logs } = await getLogs(filters, null, 1000)
    
    if (format === 'csv') {
      const headers = ['ID', 'Type', 'Zone ID', 'Device ID', 'Timestamp', 'Location']
      const rows = logs.map(log => [
        log.id,
        log.type,
        log.zoneId,
        log.deviceId,
        log.timestamp?.toISOString(),
        log.location ? `${log.location.lat},${log.location.lng}` : ''
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    
    return JSON.stringify(logs, null, 2)
  } catch (error) {
    console.error('Error exporting logs:', error)
    throw error
  }
}
