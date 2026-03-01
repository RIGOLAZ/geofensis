import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'

const DEVICES_COLLECTION = 'devices'

export const getDevices = async () => {
  try {
    const q = query(collection(db, DEVICES_COLLECTION), orderBy('lastUpdate', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdate: doc.data().lastUpdate?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('Error fetching devices:', error)
    throw error
  }
}

export const subscribeToDevices = (callback) => {
  const q = query(collection(db, DEVICES_COLLECTION), orderBy('lastUpdate', 'desc'))
  
  return onSnapshot(q, (snapshot) => {
    const devices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdate: doc.data().lastUpdate?.toDate?.() || new Date()
    }))
    callback(devices)
  })
}

export const updateDevice = async (deviceId, data) => {
  await updateDoc(doc(db, DEVICES_COLLECTION, deviceId), {
    ...data,
    updatedAt: serverTimestamp()
  })
}