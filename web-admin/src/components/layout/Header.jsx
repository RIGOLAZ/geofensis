import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);

  // Auth state - récupère l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Admin',
          email: currentUser.email,
          photoURL: currentUser.photoURL, // Photo Google
        });
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Notifications temps réel depuis Firebase
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'alerts'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(alerts);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const unreadCount = notifications.length;

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Geofencing Pro
        </Typography>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton 
            color="inherit"
            onClick={(e) => setNotifAnchorEl(e.currentTarget)}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Menu Notifications */}
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={() => setNotifAnchorEl(null)}
          PaperProps={{ sx: { width: 360, maxHeight: 400 } }}
        >
          {notifications.length === 0 ? (
            <MenuItem disabled>Aucune notification</MenuItem>
          ) : (
            notifications.map(notif => (
              <MenuItem key={notif.id} onClick={() => setNotifAnchorEl(null)}>
                <Box>
                  <Typography variant="subtitle2" color={notif.type === 'sos' ? 'error' : 'inherit'}>
                    {notif.type === 'sos' ? '🆘 SOS' : notif.type === 'intrusion' ? '🚨 Intrusion' : '⚠️ Alerte'}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {notif.deviceName || notif.deviceId}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notif.message?.substring(0, 50)}...
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>

        {/* Profil Admin avec photo Google */}
        <Tooltip title={user?.displayName || 'Profil'}>
          <IconButton 
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ ml: 2 }}
          >
            <Avatar 
              src={user?.photoURL} // Photo Google si disponible
              alt={user?.displayName}
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: user?.photoURL ? 'transparent' : 'primary.dark'
              }}
            >
              {/* Fallback si pas de photo */}
              {!user?.photoURL && (user?.displayName?.[0] || 'A')}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Menu Profil */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem disabled>
            <Box>
              <Typography variant="subtitle2">{user?.displayName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { navigate('/settings'); setAnchorEl(null); }}>
            <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
            Paramètres
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Déconnexion
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;