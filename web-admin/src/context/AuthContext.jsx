import React, { createContext, useState, useEffect, useCallback } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut 
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Firebase config (mets ta vraie config)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialisation Firebase (une seule fois)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Création du contexte
export const AuthContext = createContext(null);

// Hook personnalisé
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
};

// Provider
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Écoute auth state
  useEffect(() => {
    console.log('AuthProvider mounted');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.email || 'null');
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fonction login - DÉFINIE AVEC useCallback pour stabilité
  const loginWithGoogle = useCallback(async () => {
    console.log('loginWithGoogle called');
    const provider = new GoogleAuthProvider();
    
    // Options pour forcer la sélection de compte
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Login success:', result.user.email);
      return result.user;
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      throw error;
    }
  }, []);

  // Fonction logout
  const logout = useCallback(async () => {
    console.log('logout called');
    try {
      await signOut(auth);
      console.log('Logout success');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  // Valeur du contexte - OBJET MÉMORISÉ
  const value = React.useMemo(() => ({
    currentUser,
    loginWithGoogle,
    logout,
    isAuthenticated: !!currentUser,
    loading,
    auth // Expose auth pour debug
  }), [currentUser, loginWithGoogle, logout, loading]);

  console.log('AuthProvider render, value:', {
    hasLogin: typeof value.loginWithGoogle === 'function',
    hasLogout: typeof value.logout === 'function',
    isAuthenticated: value.isAuthenticated
  });

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        Chargement auth...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};