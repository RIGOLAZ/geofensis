import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './src/api/firebase.js'

const seedData = async () => {
  // Ajouter une zone test
  await addDoc(collection(db, 'zones'), {
    name: 'Zone Test Paris',
    type: 'circle',
    center: { lat: 48.8566, lng: 2.3522 },
    radius: 500,
    alertLevel: 'high',
    active: true,
    createdAt: serverTimestamp()
  })

  // Ajouter un device test
  await addDoc(collection(db, 'devices'), {
    name: 'Device Test 1',
    status: 'online',
    platform: 'android',
    lastLocation: { lat: 48.8566, lng: 2.3522 },
    lastUpdate: serverTimestamp()
  })

  console.log('Données de test créées !')
}

seedData()
