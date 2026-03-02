import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Badge,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  BatteryFull as BatteryIcon,
  SignalCellularAlt as SignalIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { collection, query, onSnapshot, deleteDoc, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';

const DevicesListPage = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [positions, setPositions] = useState({});
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, device: null });
  const [editDialog, setEditDialog] = useState({ open: false, device: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [simulatingDevice, setSimulatingDevice] = useState(null);

  // Charger devices et positions en temps réel
  useEffect(() => {
    setLoading(true);

    // 1. Charger les zones pour référence
    const zonesUnsub = onSnapshot(collection(db, 'zones'), (snap) => {
      setZones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Charger les devices (workers)
    const devicesQuery = query(collection(db, 'workers'));
    const devicesUnsub = onSnapshot(devicesQuery, (snapshot) => {
      const devicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastSeen: doc.data().lastSeen?.toDate?.() || null,
      }));
      setDevices(devicesData);
      setLoading(false);
    });

    // 3. Charger les positions en temps réel
    const positionsUnsub = onSnapshot(collection(db, 'positions'), (snap) => {
      const posData = {};
      snap.docs.forEach(doc => {
        posData[doc.id] = {
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        };
      });
      setPositions(posData);
    });

    return () => {
      zonesUnsub();
      devicesUnsub();
      positionsUnsub();
    };
  }, []);

  // Démarrer simulation pour un device
  const startSimulation = async (device) => {
    // Récupérer une zone pour la simulation
    const zonesSnap = await getDocs(collection(db, 'zones'));
    if (zonesSnap.empty) {
      alert('Créez d\'abord une zone pour tester');
      return;
    }
    
    const firstZone = { id: zonesSnap.docs[0].id, ...zonesSnap.docs[0].data() };
    
    // Créer position initiale simulée
    await updateDoc(doc(db, 'positions', device.id), {
      workerId: device.id,
      workerName: device.name,
      deviceType: 'smartwatch-sim',
      lat: firstZone.center?.lat || firstZone.coordinates?.[0]?.lat || 48.8566,
      lng: firstZone.center?.lng || firstZone.coordinates?.[0]?.lng || 2.3522,
      timestamp: new Date(),
      battery: 85,
      isMocked: true,
      simulating: true,
      targetZoneId: firstZone.id,
    });

    setSimulatingDevice(device.id);
    setSnackbar({
      open: true,
      message: `Simulation démarrée pour ${device.name} sur zone "${firstZone.name}"`,
      severity: 'info'
    });

    // Simuler mouvement automatique
    simulateMovement(device.id, firstZone);
  };

  // Simulation de mouvement (entrée/sortie zone)
  const simulateMovement = async (deviceId, zone) => {
    const steps = [
      { offset: 200, delay: 0, label: 'Hors zone (200m)' },
      { offset: 100, delay: 3000, label: 'Approche (100m)' },
      { offset: 50, delay: 6000, label: 'Proche (50m)' },
      { offset: 20, delay: 9000, label: 'Entrée zone!' },
      { offset: 0, delay: 12000, label: 'Centre zone' },
      { offset: 20, delay: 15000, label: 'Sortie zone' },
      { offset: 100, delay: 18000, label: 'Éloignement' },
      { offset: 200, delay: 21000, label: 'Hors zone' },
    ];

    const center = zone.type === 'circle' ? zone.center : zone.coordinates[0];

    for (const step of steps) {
      setTimeout(async () => {
        const newPos = offsetCoordinate(center, step.offset, Math.random() * 360);
        
        await updateDoc(doc(db, 'positions', deviceId), {
          lat: newPos.lat,
          lng: newPos.lng,
          timestamp: new Date(),
          battery: 80 + Math.floor(Math.random() * 15),
          simulationStep: step.label,
        });

        // Créer alerte si entrée/sortie
        if (step.label.includes('Entrée')) {
          await createAlert(deviceId, zone, 'entry', newPos);
        } else if (step.label.includes('Sortie')) {
          await createAlert(deviceId, zone, 'exit', newPos);
        }

      }, step.delay);
    }

    // Arrêter simulation après 25 secondes
    setTimeout(() => {
      setSimulatingDevice(null);
      updateDoc(doc(db, 'positions', deviceId), { simulating: false });
    }, 25000);
  };

  const createAlert = async (workerId, zone, type, position) => {
    const device = devices.find(d => d.id === workerId);
    await setDoc(doc(collection(db, 'alerts')), {
      workerId,
      workerName: device?.name || 'Inconnu',
      zoneId: zone.id,
      zoneName: zone.name,
      zoneAlertLevel: zone.alertLevel,
      type,
      position,
      timestamp: new Date(),
      smsAlert: zone.smsAlert,
      contactPhone: zone.contactPhone,
      smsSent: false,
    });
  };

  const offsetCoordinate = (coord, distanceMeters, angleDegrees) => {
    const earthRadius = 6371000;
    const angleRad = angleDegrees * (Math.PI / 180);
    const latRad = coord.lat * (Math.PI / 180);
    const lngRad = coord.lng * (Math.PI / 180);
    
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distanceMeters / earthRadius) +
      Math.cos(latRad) * Math.sin(distanceMeters / earthRadius) * Math.cos(angleRad)
    );
    
    const newLngRad = lngRad + Math.atan2(
      Math.sin(angleRad) * Math.sin(distanceMeters / earthRadius) * Math.cos(latRad),
      Math.cos(distanceMeters / earthRadius) - Math.sin(latRad) * Math.sin(newLatRad)
    );
    
    return {
      lat: newLatRad * (180 / Math.PI),
      lng: newLngRad * (180 / Math.PI)
    };
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'workers', deleteDialog.device.id));
      // Supprimer aussi la position
      await deleteDoc(doc(db, 'positions', deleteDialog.device.id));
      setSnackbar({ open: true, message: 'Device supprimé', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur: ' + error.message, severity: 'error' });
    }
    setDeleteDialog({ open: false, device: null });
  };

  const handleEdit = async () => {
    try {
      await updateDoc(doc(db, 'workers', editDialog.device.id), {
        name: editDialog.device.name,
        phone: editDialog.device.phone,
        active: editDialog.device.active,
      });
      setSnackbar({ open: true, message: 'Device mis à jour', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur: ' + error.message, severity: 'error' });
    }
    setEditDialog({ open: false, device: null });
  };

  const getStatusColor = (device) => {
    const pos = positions[device.id];
    if (!pos) return 'default';
    const age = Date.now() - pos.timestamp.getTime();
    if (age < 60000) return 'success'; // < 1 min
    if (age < 300000) return 'warning'; // < 5 min
    return 'error'; // > 5 min
  };

  const getStatusText = (device) => {
    const pos = positions[device.id];
    if (!pos) return 'Hors ligne';
    const age = Date.now() - pos.timestamp.getTime();
    if (age < 60000) return 'En ligne';
    if (age < 300000) return 'Inactif';
    return 'Hors ligne';
  };

  const isInZone = (deviceId) => {
    const pos = positions[deviceId];
    if (!pos) return null;
    
    for (const zone of zones) {
      if (zone.type === 'circle') {
        const dist = getDistance(pos.lat, pos.lng, zone.center.lat, zone.center.lng);
        if (dist <= zone.radius) return zone;
      } else {
        if (isPointInPolygon(pos.lat, pos.lng, zone.coordinates)) return zone;
      }
    }
    return null;
  };

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const isPointInPolygon = (lat, lng, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Devices / Travailleurs</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/devices/create')}
        >
          Ajouter Device
        </Button>
      </Box>

      {loading ? <LinearProgress /> : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Zone</TableCell>
                <TableCell>Batterie</TableCell>
                <TableCell>Dernière position</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device) => {
                const pos = positions[device.id];
                const currentZone = isInZone(device.id);
                const isSimulating = simulatingDevice === device.id;

                return (
                  <TableRow key={device.id}>
                    <TableCell>
                      <Badge 
                        variant="dot" 
                        color={getStatusColor(device)}
                        invisible={!pos}
                      >
                        <Chip 
                          label={getStatusText(device)} 
                          size="small"
                          color={getStatusColor(device)}
                        />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">{device.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {device.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {pos ? (
                        <Tooltip title={`${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon color="primary" fontSize="small" />
                            <Typography variant="body2">
                              {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
                            </Typography>
                            {pos.isMocked && (
                              <Chip label="SIM" size="small" color="warning" />
                            )}
                          </Box>
                        </Tooltip>
                      ) : (
                        <Typography color="textSecondary">Inconnue</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {currentZone ? (
                        <Chip 
                          label={currentZone.name} 
                          size="small" 
                          color={currentZone.alertLevel === 'high' ? 'error' : 
                                 currentZone.alertLevel === 'medium' ? 'warning' : 'success'}
                        />
                      ) : (
                        <Typography color="textSecondary">Hors zone</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {pos?.battery ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BatteryIcon 
                            color={pos.battery > 20 ? 'success' : 'error'} 
                            fontSize="small"
                          />
                          <Typography>{pos.battery}%</Typography>
                        </Box>
                      ) : (
                        <Typography color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {pos ? (
                        <Typography variant="caption">
                          {pos.timestamp.toLocaleTimeString()}
                        </Typography>
                      ) : (
                        <Typography color="textSecondary">Jamais</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => startSimulation(device)}
                        disabled={isSimulating || !zones.length}
                        color={isSimulating ? 'success' : 'primary'}
                      >
                        {isSimulating ? <SignalIcon /> : <PlayIcon />}
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => setEditDialog({ open: true, device })}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => setDeleteDialog({ open: true, device })}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialogs... */}
    </Box>
  );
};

export default DevicesListPage;