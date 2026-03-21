// src/config/firebase.js
import { Platform } from 'react-native';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Pas besoin de configuration manuelle !
// react-native-firebase utilise automatiquement google-services.json

export { auth, firestore };
export default firebase;