// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const AuthContext = createContext({});

// Configurer Google Sign-In
GoogleSignin.configure({
  webClientId: 'VOTRE_CLIENT_ID_WEB.apps.googleusercontent.com',
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithEmail = (email, password) => {
    return auth().signInWithEmailAndPassword(email, password);
  };

  const loginWithGoogle = async () => {
    try {
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      return auth().signInWithCredential(googleCredential);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const register = (email, password) => {
    return auth().createUserWithEmailAndPassword(email, password);
  };

  const logout = () => {
    return auth().signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithEmail,
      loginWithGoogle,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};