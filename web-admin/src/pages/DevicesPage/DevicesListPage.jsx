import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  BatteryFull as BatteryIcon,
  LocationOn as LocationIcon,
  Watch as WatchIcon
} from '@mui/icons-material';
import { db } from '../../config/firebase';

const DevicesListPage = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);

  useEffect(() => {
    // ✅ Requête Firestore temps réel
    const q = query(
      collection(db, 'devices'),
      orderBy('createdAt', 'desc') // Les plus récents d'abord
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const devicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Devices chargés:', devicesData); // Debug
        setDevices(devicesData);
        setLoading(false);
      },
      (err) => {
        console.error('Erreur Firestore:', err);
        setError('Erreur de chargement: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!deviceToDelete) return;
    try {
      await deleteDoc(doc(db, 'devices', deviceToDelete.id));
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
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
    if (level === null || level === undefined) return 'default';
    if (level > 50) return 'success';
    if (level > 20) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WatchIcon color="primary" />
          Bracelets TCAS
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/devices/create')}
        >
          Nouveau Bracelet
        </Button>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Tableau des devices */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Batterie</TableCell>
              <TableCell>Assigné à</TableCell>
              <TableCell>Dernière position</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Aucun bracelet enregistré
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/devices/create')}
                    sx={{ mt: 2 }}
                  >
                    Créer le premier bracelet
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => (
                <TableRow key={device.id} hover>
                  <TableCell>
                    <Typography fontWeight="medium">{device.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <code>{device.deviceId}</code>
                  </TableCell>
                  <TableCell>{device.type}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={device.status?.toUpperCase() || 'INCONNU'}
                      color={getStatusColor(device.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={<BatteryIcon />}
                      label={device.batteryLevel !== null ? `${device.batteryLevel}%` : 'N/A'}
                      color={getBatteryColor(device.batteryLevel)}
                    />
                  </TableCell>
                  <TableCell>{device.assignedTo || '-'}</TableCell>
                  <TableCell>
                    {device.lastSeen ? (
                      <Tooltip title={device.lastSeen.toDate().toLocaleString()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon fontSize="small" color="success" />
                          {device.lastSeen.toDate().toLocaleDateString()}
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography color="text.secondary" variant="body2">Jamais</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Voir détails">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/devices/${device.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton
                        color="error"
                        onClick={() => {
                          setDeviceToDelete(device);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de confirmation suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le bracelet "{deviceToDelete?.name}" ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DevicesListPage;