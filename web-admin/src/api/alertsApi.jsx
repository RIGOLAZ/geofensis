import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

const ALERTS_COLLECTION = 'alerts';

export const alertsApi = {
  // Créer une alerte (appelé par Cloud Function ou mobile)
  create: async (alertData) => {
    return await addDoc(collection(db, ALERTS_COLLECTION), {
      ...alertData,
      timestamp: serverTimestamp(),
      read: false,
    });
  },

  // Récupérer alertes non lues
  getUnread: async () => {
    const q = query(
      collection(db, ALERTS_COLLECTION),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Écouter alertes temps réel
  onAlertsChange: (callback) => {
    const q = query(
      collection(db, ALERTS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(alerts);
    });
  },

  // Marquer comme lue
  markAsRead: async (alertId) => {
    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, ALERTS_COLLECTION, alertId), { read: true });
  }
};