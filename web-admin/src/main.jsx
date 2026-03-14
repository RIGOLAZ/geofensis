// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { AuthProvider } from './context/AuthContext';  // Vérifiez ce chemin
import { GoogleMapsProvider } from './context/GoogleMapsContext';
import App from './App';
import { store } from './store/store';

console.log("Index.js - AuthProvider importé:", AuthProvider); // Debug

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ 
        v7_relativeSplatPath: true,
        v7_startTransition: true 
      }}>
        <AuthProvider>
          <GoogleMapsProvider>
            <App />
          </GoogleMapsProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);