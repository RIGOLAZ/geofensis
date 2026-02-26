import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'

const ZONES_COLLECTION = 'zones'

// Récupérer toutes les zones (données réelles)
export const getZones = async (activeOnly = false) => {
  try {
    let q = query(collection(db, ZONES_COLLECTION), orderBy('createdAt', 'desc'))
    
    if (activeOnly) {
      q = query(collection(db, ZONES_COLLECTION), where('active', '==', true))
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('Error fetching zones:', error)
    throw error
  }
}

// Récupérer une zone par ID
export const getZoneById = async (zoneId) => {
  try {
    const docRef = doc(db, ZONES_COLLECTION, zoneId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      throw new Error('Zone not found')
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date()
    }
  } catch (error) {
    console.error('Error fetching zone:', error)
    throw error
  }
}

// Créer une nouvelle zone
export const createZone = async (zoneData) => {
  try {
    const data = {
      ...zoneData,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: localStorage.getItem('userId') || 'system'
    }
    
    const docRef = await addDoc(collection(db, ZONES_COLLECTION), data)
    return { id: docRef.id, ...data }
  } catch (error) {
    console.error('Error creating zone:', error)
    throw error
  }
}

// Mettre à jour une zone
export const updateZone = async (zoneId, zoneData) => {
  try {
    const docRef = doc(db, ZONES_COLLECTION, zoneId)
    const updateData = {
      ...zoneData,
      updatedAt: serverTimestamp()
    }
    
    await updateDoc(docRef, updateData)
    return { id: zoneId, ...updateData }
  } catch (error) {
    console.error('Error updating zone:', error)
    throw error
  }
}

// Supprimer une zone (soft delete)
export const deleteZone = async (zoneId) => {
  try {
    const docRef = doc(db, ZONES_COLLECTION, zoneId)
    await updateDoc(docRef, {
      active: false,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { id: zoneId, deleted: true }
  } catch (error) {
    console.error('Error deleting zone:', error)
    throw error
  }
}

// Suppression définitive
export const permanentDeleteZone = async (zoneId) => {
  try {
    await deleteDoc(doc(db, ZONES_COLLECTION, zoneId))
    return { id: zoneId, permanentlyDeleted: true }
  } catch (error) {
    console.error('Error permanently deleting zone:', error)
    throw error
  }
}

// Souscrire aux changements de zones (temps réel)
export const subscribeToZones = (callback, activeOnly = false) => {
  let q = query(collection(db, ZONES_COLLECTION), orderBy('updatedAt', 'desc'))
  
  if (activeOnly) {
    q = query(collection(db, ZONES_COLLECTION), where('active', '==', true))
  }
  
  return onSnapshot(q, (snapshot) => {
    const zones = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    }))
    callback(zones)
  }, (error) => {
    console.error('Error in zones subscription:', error)
  })
}

// Importer des zones depuis GeoJSON
export const importZonesFromGeoJSON = async (geojson) => {
  try {
    const features = geojson.features || []
    const results = []
    
    for (const feature of features) {
      const zoneData = {
        name: feature.properties.name || `Zone ${feature.properties.id || Date.now()}`,
        type: feature.geometry.type === 'Point' ? 'circle' : 'polygon',
        description: feature.properties.description || '',
        alertLevel: feature.properties.alertLevel || 'medium',
        coordinates: feature.geometry.coordinates[0]?.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        })) || [],
        center: feature.geometry.type === 'Point' ? {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0]
        } : null,
        radius: feature.properties.radius || null,
        color: feature.properties.color || '#FF0000',
        active: true
      }
      
      const result = await createZone(zoneData)
      results.push(result)
    }
    
    return results
  } catch (error) {
    console.error('Error importing zones:', error)
    throw error
  }
}

// Exporter les zones en GeoJSON
export const exportZonesToGeoJSON = async () => {
  try {
    const zones = await getZones()
    
    const features = zones.map(zone => ({
      type: 'Feature',
      properties: {
        name: zone.name,
        description: zone.description,
        alertLevel: zone.alertLevel,
        radius: zone.radius,
        color: zone.color,
        id: zone.id
      },
      geometry: zone.type === 'circle' ? {
        type: 'Point',
        coordinates: [zone.center?.lng || 0, zone.center?.lat || 0]
      } : {
        type: 'Polygon',
        coordinates: [zone.coordinates?.map(c => [c.lng, c.lat]) || []]
      }
    }))
    
    return {
      type: 'FeatureCollection',
      features
    }
  } catch (error) {
    console.error('Error exporting zones:', error)
    throw error
  }
}