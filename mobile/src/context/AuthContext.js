import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userData
        });
        setRole(userData?.role || 'user');
        
        await AsyncStorage.setItem('user', JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email
        }));
      } else {
        setUser(null);
        setRole(null);
        await AsyncStorage.removeItem('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, userData) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        role: 'user',
        createdAt: new Date(),
        ...userData
      });

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      loading, 
      login, 
      register, 
      logout,
      isAdmin: role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);