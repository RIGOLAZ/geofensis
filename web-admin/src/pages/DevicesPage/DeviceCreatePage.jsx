import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Watch as WatchIcon
} from '@mui/icons-material';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const DeviceCreatePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    deviceId: '',
    type: 'tcas',
    description: '',
    assignedTo: '',
    phoneNumber: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    status: 'inactive'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Le nom du bracelet est obligatoire';
    if (!formData.deviceId.trim()) return 'L\'ID du bracelet est obligatoire';
    if (!/^[A-Z0-9-]+$/i.test(formData.deviceId)) return 'L\'ID ne doit contenir que lettres, chiffres et tirets';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const deviceData = {
        ...formData,
        deviceId: formData.deviceId.toUpperCase(),
        createdAt: serverTimestamp(),
        createdBy: currentUser?.uid || 'system',
        updatedAt: serverTimestamp(),
        lastSeen: null,
        batteryLevel: null,
        location: null,
        geofenceZones: [],
        bleConfig: {
          serviceUUID: null,
          characteristicUUID: null,
          lastConnected: null
        }
      };

      const docRef = await addDoc(collection(db, 'devices'), deviceData);
      
      setSuccess(`Bracelet "${formData.name}" créé avec succès !`);
      
      // Redirection après 2 secondes
      setTimeout(() => {
        navigate(`/devices/${docRef.id}`);
      }, 2000);

    } catch (err) {
      console.error('Erreur création:', err);
      setError(err.message || 'Erreur lors de la création du bracelet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/devices')}
          sx={{ mr: 2 }}
        >
          Retour
        </Button>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WatchIcon color="primary" />
          Nouveau Bracelet TCAS
        </Typography>
      </Box>

      {/* Alertes */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Section Informations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📟 Informations Bracelet
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <TextField
                  fullWidth
                  label="Nom du bracelet *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Bracelet Étage 1"
                  margin="normal"
                  required
                  disabled={loading}
                />

                <TextField
                  fullWidth
                  label="ID Unique (MAC/Serial) *"
                  name="deviceId"
                  value={formData.deviceId}
                  onChange={handleChange}
                  placeholder="Ex: TCAS-A1B2C3D4"
                  margin="normal"
                  required
                  disabled={loading}
                  helperText="Cet ID doit correspondre au bracelet physique"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel>Type de bracelet</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    label="Type de bracelet"
                    disabled={loading}
                  >
                    <MenuItem value="tcas">TCAS Standard</MenuItem>
                    <MenuItem value="tcas-pro">TCAS Pro (Batterie longue durée)</MenuItem>
                    <MenuItem value="tcas-mini">TCAS Mini (Enfant)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Notes sur l'emplacement, l'utilisation..."
                  margin="normal"
                  multiline
                  rows={3}
                  disabled={loading}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Section Attribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  👤 Attribution
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <TextField
                  fullWidth
                  label="Assigné à"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  placeholder="Nom de la personne"
                  margin="normal"
                  disabled={loading}
                />

                <TextField
                  fullWidth
                  label="Téléphone"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  margin="normal"
                  disabled={loading}
                />

                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  margin="normal"
                  disabled={loading}
                />

                <TextField
                  fullWidth
                  label="Contact d'urgence"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Nom du contact d'urgence"
                  margin="normal"
                  disabled={loading}
                />

                <TextField
                  fullWidth
                  label="Téléphone d'urgence"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  placeholder="+33 6 98 76 54 32"
                  margin="normal"
                  disabled={loading}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Boutons d'action */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/devices')}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer le bracelet'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default DeviceCreatePage;