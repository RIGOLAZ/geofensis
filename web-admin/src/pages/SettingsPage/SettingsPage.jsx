import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Switch,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Backup as BackupIcon,
} from '@mui/icons-material';

const SettingsPage = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Paramètres
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <List>
          <ListItem>
            <ListItemText
              primary="Notifications par email"
              secondary="Recevoir les alertes par email"
            />
            <Switch
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Notifications push"
              secondary="Recevoir les alertes en temps réel"
            />
            <Switch
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ mb: 2 }}>
        <List>
          <ListItem>
            <ListItemText
              primary="Mode sombre"
              secondary="Activer le thème sombre"
            />
            <Switch
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
          </ListItem>
        </List>
      </Paper>

      <Paper>
        <List>
          <ListItemButton onClick={() => setBackupDialogOpen(true)}>
            <ListItemText
              primary="Sauvegarde des données"
              secondary="Exporter toutes les données"
            />
          </ListItemButton>
        </List>
      </Paper>

      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)}>
        <DialogTitle>Sauvegarde des données</DialogTitle>
        <DialogContent>
          <Typography>
            Cette opération va exporter toutes les zones, devices et logs dans un fichier JSON.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={() => setBackupDialogOpen(false)}>
            Exporter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
