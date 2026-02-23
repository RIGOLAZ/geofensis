import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const { user } = useAuth();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (user && token) {
        saveTokenToDatabase(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification clicked:', data);
      // Navigation vers l'écran approprié selon le type de notification
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [user]);

  const saveTokenToDatabase = async (token) => {
    if (!user) return;
    
    await setDoc(doc(db, 'devices', user.uid), {
      fcmToken: token,
      platform: Platform.OS,
      updatedAt: new Date(),
    }, { merge: true });
  };

  const sendLocalNotification = async (title, body, data = {}) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  };

  return (
    <NotificationContext.Provider value={{
      expoPushToken,
      notification,
      sendLocalNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

export const useNotification = () => useContext(NotificationContext);