import { useState, useEffect } from 'react';
import { alertsApi } from '../api/alertsApi';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = alertsApi.onAlertsChange((updatedAlerts) => {
      setAlerts(updatedAlerts);
      setUnreadCount(updatedAlerts.filter(a => !a.read).length);
    });

    return () => unsubscribe();
  }, []);

  return { alerts, unreadCount };
};