import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'

const DEVICES_COLLECTION = 'devices'

// Récupérer tous les devices
export const getDevices = async (status = null) => {
  try {
    let q = query(collection(db, DEVICES_COLLECTION), orderBy('lastUpdate', 'desc'))
    
    if (status) {
      q = query(collection(db, DEVICES_COLLECTION), where('status', '==', status))
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdate: doc.data().lastUpdate?.toDate(),
      createdAt: doc.data().createdAt?.toDate()
    }))
  } catch (error) {
    console.error('Error fetching devices:', error)
    throw error
  }
}

// Récupérer un device par ID
export const getDeviceById = async (deviceId) => {
  try {
    const docRef = doc(db, DEVICES_COLLECTION, deviceId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      throw new Error('Device not found')
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      lastUpdate: docSnap.data().lastUpdate?.toDate(),
      createdAt: docSnap.data().createdAt?.toDate()
    }
  } catch (error) {
    console.error('Error fetching device:', error)
    throw error
  }
}

// Mettre à jour un device
export const updateDevice = async (deviceId, deviceData) => {
  try {
    const docRef = doc(db, DEVICES_COLLECTION, deviceId)
    await updateDoc(docRef, {
      ...deviceData,
      updatedAt: serverTimestamp()
    })
    return { id: deviceId, ...deviceData }
  } catch (error) {
    console.error('Error updating device:', error)
    throw error
  }
}

// Souscrire aux changements de devices (temps réel)
export const subscribeToDevices = (callback) => {
  const q = query(collection(db, DEVICES_COLLECTION), orderBy('lastUpdate', 'desc'))
  
  return onSnapshot(q, (snapshot) => {
    const devices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdate: doc.data().lastUpdate?.toDate()
    }))
    callback(devices)
  })
}

// Récupérer l'historique de localisation d'un device
export const getDeviceLocationHistory = async (deviceId, startDate, endDate) => {
  try {
    const logsRef = collection(db, 'geofence_logs')
    let q = query(
      logsRef,
      where('deviceId', '==', deviceId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }))
  } catch (error) {
    console.error('Error fetching device history:', error)
    throw error
  }
}

// Envoyer une commande à un device
export const sendCommandToDevice = async (deviceId, command, payload = {}) => {
  try {
    const commandsRef = collection(db, 'device_commands')
    await addDoc(commandsRef, {
      deviceId,
      command,
      payload,
      status: 'pending',
      createdAt: serverTimestamp()
    })
    return { success: true, deviceId, command }
  } catch (error) {
    console.error('Error sending command:', error)
    throw error
  }
}

// Récupérer les statistiques des devices
export const getDeviceStats = async () => {
  try {
    const devices = await getDevices()
    
    return {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      warning: devices.filter(d => d.batteryLevel < 20).length,
      byPlatform: devices.reduce((acc, d) => {
        acc[d.platform] = (acc[d.platform] || 0) + 1
        return acc
      }, {})
    }
  } catch (error) {
    console.error('Error fetching device stats:', error)
    throw error
  }
}
