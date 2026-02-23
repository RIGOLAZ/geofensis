import React, { useEffect, useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  Login as LoginIcon,
  Logout as LogoutIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const RecentAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'geofence_logs'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timeAgo: doc.data().timestamp?.toDate?.()
          ? formatDistanceToNow(doc.data().timestamp.toDate(), { locale: fr, addSuffix: true })
          : 'Inconnu',
      }));
      setAlerts(alertsData);
    });

    return () => unsubscribe();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'ZONE_ENTRY':
        return <LoginIcon color="error" />;
      case 'ZONE_EXIT':
        return <LogoutIcon color="success" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getLabel = (type) => {
    switch (type) {
      case 'ZONE_ENTRY':
        return <Chip size="small" label="EntrÃ©e" color="error" />;
      case 'ZONE_EXIT':
        return <Chip size="small" label="Sortie" color="success" />;
      default:
        return <Chip size="small" label="Inconnu" />;
    }
  };

  if (alerts.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="textSecondary">Aucune alerte rÃ©cente</Typography>
      </Box>
    );
  }

  return (
    <List dense>
      {alerts.map((alert, index) => (
        <React.Fragment key={alert.id}>
          <ListItem>
            <ListItemIcon>{getIcon(alert.type)}</ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getLabel(alert.type)}
                  <Typography variant="body2" component="span">
                    {alert.zoneName || alert.zoneId}
                  </Typography>
                </Box>
              }
              secondary={
                <>
                  <Typography variant="caption" display="block">
                    Device: {alert.deviceId}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {alert.timeAgo}
                  </Typography>
                </>
              }
            />
          </ListItem>
          {index < alerts.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default RecentAlerts;
