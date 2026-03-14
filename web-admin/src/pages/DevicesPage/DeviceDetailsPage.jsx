import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

// Material-UI imports...
import {
  Box, Paper, Typography, Grid, Button, Chip, Divider, Card, CardContent,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Tab, Tabs, Alert, CircularProgress, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, Edit as EditIcon, Delete as DeleteIcon,
  LocationOn as LocationIcon, BatteryFull as BatteryIcon,
  Bluetooth as BluetoothIcon, Notifications as AlertIcon,
  Person as PersonIcon, Save as SaveIcon, MyLocation as MapIcon
} from '@mui/icons-material';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useGoogleMaps } from '../../context/GoogleMapsContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DeviceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isLoaded, loadError, google, initMap } = useGoogleMaps(); // ✅ Utilise ton hook
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);
  
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Chargement du device
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'devices', id),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setDevice(data);
          setFormData(data);
        } else {
          setError('Bracelet non trouvé');
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Erreur de chargement');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [id]);

  // ✅ Initialisation de la carte quand Google Maps est chargé ET qu'on est sur l'onglet carte
  useEffect(() => {
    if (!isLoaded || !google || !mapRef.current || tabValue !== 1) return;
    
    // Nettoyage précédent
    if (mapInstanceRef.current) {
      markersRef.current.forEach(m => m.setMap(null));
      circlesRef.current.forEach(c => c.setMap(null));
      markersRef.current = [];
      circlesRef.current = [];
    }

    // Création de la carte via ton initMap
    const center = device?.location 
      ? { lat: device.location.lat, lng: device.location.lng }
      : { lat: 48.8566, lng: 2.3522 }; // Paris par défaut

    mapInstanceRef.current = initMap(mapRef, {
      center,
      zoom: device?.location ? 16 : 13,
      mapTypeId: 'hybrid',
    });

    if (!mapInstanceRef.current) return;

    // Ajout du marqueur du device (AdvancedMarkerElement si disponible, sinon Marker)
    if (device?.location) {
      const position = { 
        lat: device.location.lat, 
        lng: device.location.lng 
      };

      let marker;
      if (google.maps.marker?.AdvancedMarkerElement) {
        // ✅ Utilise AdvancedMarkerElement (nouvelle API)
        const markerContent = document.createElement('div');
        markerContent.innerHTML = `
          <div style="
            background: #2196f3;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        `;
        
        marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position,
          title: device.name,
          content: markerContent,
        });
      } else {
        // Fallback ancienne API Marker
        marker = new google.maps.Marker({
          map: mapInstanceRef.current,
          position,
          title: device.name,
          animation: google.maps.Animation.DROP,
        });
      }
      markersRef.current.push(marker);

      // Cercle de précision GPS
      if (device.location.accuracy) {
        const accuracyCircle = new google.maps.Circle({
          map: mapInstanceRef.current,
          center: position,
          radius: device.location.accuracy,
          fillColor: '#2196f3',
          fillOpacity: 0.15,
          strokeColor: '#2196f3',
          strokeOpacity: 0.5,
          strokeWeight: 1,
        });
        circlesRef.current.push(accuracyCircle);
      }
    }

    // Zones géofencing
    device?.geofenceZones?.forEach((zone) => {
      const zoneCircle = new google.maps.Circle({
        map: mapInstanceRef.current,
        center: { lat: zone.lat, lng: zone.lng },
        radius: zone.radius,
        fillColor: zone.type === 'safe' ? '#4caf50' : '#f44336',
        fillOpacity: 0.2,
        strokeColor: zone.type === 'safe' ? '#4caf50' : '#f44336',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
      circlesRef.current.push(zoneCircle);
    });

    // Cleanup
    return () => {
      markersRef.current.forEach(m => m.setMap?.(null) || m.map?.set(null));
      circlesRef.current.forEach(c => c.setMap(null));
      markersRef.current = [];
      circlesRef.current = [];
    };
  }, [isLoaded, google, initMap, device, tabValue]);

  // Handlers...
  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'devices', id), {
        ...formData,
        updatedAt: new Date()
      });
      setEditMode(false);
    } catch (err) {
      setError('Erreur de sauvegarde: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'devices', id));
      navigate('/devices');
    } catch (err) {
      setError('Erreur de suppression: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'alert': return 'error';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getBatteryColor = (level) => {
    if (level === null) return 'default';
    if (level > 50) return 'success';
    if (level > 20) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/devices')} sx={{ mt: 2 }}>
          Retour aux appareils
        </Button>
      </Box>
    );
  }

  if (!device) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/devices')}>
              Retour
            </Button>
            <Typography variant="h4" component="h1">
              {device.name}
            </Typography>
            <Chip 
              label={device.status?.toUpperCase() || 'INCONNU'} 
              color={getStatusColor(device.status)}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {editMode ? (
              <>
                <Button variant="outlined" onClick={() => setEditMode(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outlined" 
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                >
                  Modifier
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Supprimer
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Info rapide */}
        <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
          <Chip 
            icon={<BatteryIcon />} 
            label={`Batterie: ${device.batteryLevel !== null ? device.batteryLevel + '%' : 'N/A'}`}
            color={getBatteryColor(device.batteryLevel)}
          />
          <Chip 
            icon={<BluetoothIcon />} 
            label={`BLE: ${device.bleConfig?.lastConnected ? 'Connecté' : 'Non connecté'}`}
            color={device.bleConfig?.lastConnected ? 'success' : 'default'}
          />
          <Chip 
            icon={<LocationIcon />} 
            label={`Dernière position: ${device.lastSeen?.toDate().toLocaleString() || 'Jamais'}`}
          />
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Informations" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Localisation" icon={<MapIcon />} iconPosition="start" />
          <Tab label="Alertes & Zones" icon={<AlertIcon />} iconPosition="start" />
        </Tabs>

        {/* Onglet Informations */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Détails du bracelet</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {editMode ? (
                    <>
                      <TextField fullWidth label="Nom" name="name" value={formData.name || ''} onChange={handleChange} margin="normal" />
                      <TextField fullWidth label="ID" name="deviceId" value={formData.deviceId || ''} onChange={handleChange} margin="normal" disabled />
                      <TextField fullWidth label="Type" name="type" value={formData.type || ''} onChange={handleChange} margin="normal" />
                      <TextField fullWidth label="Description" name="description" value={formData.description || ''} onChange={handleChange} margin="normal" multiline rows={3} />
                    </>
                  ) : (
                    <List dense>
                      <ListItem><ListItemText primary="ID" secondary={device.deviceId} /></ListItem>
                      <ListItem><ListItemText primary="Type" secondary={device.type} /></ListItem>
                      <ListItem><ListItemText primary="Description" secondary={device.description || 'Aucune'} /></ListItem>
                      <ListItem><ListItemText primary="Créé le" secondary={device.createdAt?.toDate().toLocaleString()} /></ListItem>
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Contact</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {editMode ? (
                    <>
                      <TextField fullWidth label="Assigné à" name="assignedTo" value={formData.assignedTo || ''} onChange={handleChange} margin="normal" />
                      <TextField fullWidth label="Téléphone" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} margin="normal" />
                      <TextField fullWidth label="Email" name="email" value={formData.email || ''} onChange={handleChange} margin="normal" />
                      <TextField fullWidth label="Contact d'urgence" name="emergencyContact" value={formData.emergencyContact || ''} onChange={handleChange} margin="normal" />
                      <TextField fullWidth label="Téléphone d'urgence" name="emergencyPhone" value={formData.emergencyPhone || ''} onChange={handleChange} margin="normal" />
                    </>
                  ) : (
                    <List dense>
                      <ListItem><ListItemText primary="Assigné à" secondary={device.assignedTo || 'Non assigné'} /></ListItem>
                      <ListItem><ListItemText primary="Téléphone" secondary={device.phoneNumber || 'Non renseigné'} /></ListItem>
                      <ListItem><ListItemText primary="Email" secondary={device.email || 'Non renseigné'} /></ListItem>
                      <ListItem><ListItemText primary="Contact d'urgence" secondary={device.emergencyContact || 'Non renseigné'} /></ListItem>
                      <ListItem><ListItemText primary="Téléphone d'urgence" secondary={device.emergencyPhone || 'Non renseigné'} /></ListItem>
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* ✅ Onglet Localisation - Utilise ton GoogleMapsContext */}
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Position actuelle</Typography>
              
              {loadError ? (
                <Alert severity="error">Erreur Google Maps: {loadError.message}</Alert>
              ) : !isLoaded ? (
                <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Chargement de la carte...</Typography>
                </Box>
              ) : device?.location ? (
                <Box 
                  ref={mapRef} 
                  sx={{ 
                    height: 400, 
                    width: '100%', 
                    borderRadius: 1,
                    overflow: 'hidden'
                  }} 
                />
              ) : (
                <Alert severity="info" icon={<LocationIcon />}>
                  Aucune position enregistrée pour ce bracelet. 
                  Le bracelet doit se connecter au moins une fois pour envoyer sa position.
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Onglet Alertes */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Zones géofencing</Typography>
                  <Divider sx={{ mb: 2 }} />
                  {device.geofenceZones?.length > 0 ? (
                    <List>
                      {device.geofenceZones.map((zone, index) => (
                        <ListItem key={index}>
                          <ListItemIcon><LocationIcon color={zone.type === 'safe' ? 'success' : 'error'} /></ListItemIcon>
                          <ListItemText 
                            primary={zone.name} 
                            secondary={`Rayon: ${zone.radius}m | Centre: ${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)}`} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">Aucune zone configurée</Typography>
                  )}
                  <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate(`/geofencing?device=${id}`)}>
                    Gérer les zones
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Dialog suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer le bracelet "{device.name}" ? Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceDetailsPage;