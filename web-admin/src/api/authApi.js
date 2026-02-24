import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

// Inscription
export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Mettre à jour le profil
    await updateProfile(user, { displayName })
    
    // Créer le document utilisateur dans Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      displayName,
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return user
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

// Connexion
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    // Mettre à jour la dernière connexion
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      lastLogin: serverTimestamp()
    })
    
    // Stocker le token
    const token = await userCredential.user.getIdToken()
    localStorage.setItem('authToken', token)
    localStorage.setItem('userId', userCredential.user.uid)
    
    return userCredential.user
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

// Déconnexion
export const logoutUser = async () => {
  try {
    await signOut(auth)
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

// Récupérer l'utilisateur courant
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    }, reject)
  })
}

// Récupérer les données utilisateur depuis Firestore
export const getUserData = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid))
    if (docSnap.exists()) {
      return { uid, ...docSnap.data() }
    }
    return null
  } catch (error) {
    console.error('Error fetching user data:', error)
    throw error
  }
}

// Mettre à jour le rôle utilisateur (admin only)
export const updateUserRole = async (uid, role) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      role,
      updatedAt: serverTimestamp()
    })
    return { uid, role }
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

// Vérifier si l'utilisateur est admin
export const isUserAdmin = async (uid) => {
  try {
    const userData = await getUserData(uid)
    return userData?.role === 'admin'
  } catch (error) {
    return false
  }
}
