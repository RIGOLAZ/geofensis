import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Typography,
  Button,
  TextField,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material'
import { getZoneById, updateZone } from '../../../api/zonesApi'
import ZoneMapEditor from '../../../components/zones/ZoneEditor/MapEditor'

export default function ZoneEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [zoneData, setZoneData] = useState(null)

  useEffect(() => {
    loadZone()
  }, [id])

  const loadZone = async () => {
    try {
      const zone = await getZoneById(id)
      setZoneData(zone)
      setLoading(false)
    } catch (err) {
      setError('Erreur chargement zone: ' + err.message)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      await updateZone(id, zoneData)
      navigate('/zones')
    } catch (err) {
      setError('Erreur sauvegarde: ' + err.message)
      setSaving(false)
    }
  }

  const handleZoneDrawn = (geometry) => {
    if (geometry.type === 'circle') {
      setZoneData(prev => ({
        ...prev,
        type: 'circle',
        center: geometry.center,
        radius: geometry.radius
      }))
    } else {
      setZoneData(prev => ({
        ...prev,
        type: 'polygon',
        coordinates: geometry.coordinates
      }))
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!zoneData) {
    return <Alert severity="error">Zone non trouvée</Alert>
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Modifier la Zone
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <TextField
          fullWidth
          label="Nom de la zone"
          value={zoneData.name || ''}
          onChange={(e) => setZoneData({ ...zoneData, name: e.target.value })}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Description"
          multiline
          rows={2}
          value={zoneData.description || ''}
          onChange={(e) => setZoneData({ ...zoneData, description: e.target.value })}
          margin="normal"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Niveau d'alerte</InputLabel>
          <Select
            value={zoneData.alertLevel || 'medium'}
            onChange={(e) => setZoneData({ ...zoneData, alertLevel: e.target.value })}
          >
            <MenuItem value="low">Faible</MenuItem>
            <MenuItem value="medium">Moyen</MenuItem>
            <MenuItem value="high">Critique</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mt: 2, height: 400 }}>
          <Typography variant="subtitle1" gutterBottom>
            Zone géographique
          </Typography>
          <ZoneMapEditor 
            onZoneDrawn={handleZoneDrawn}
            defaultType={zoneData.type}
            initialGeometry={
              zoneData.type === 'circle' 
                ? { type: 'circle', center: zoneData.center, radius: zoneData.radius }
                : { type: 'polygon', coordinates: zoneData.coordinates }
            }
          />
        </Box>

        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={saving}
            startIcon={saving && <CircularProgress size={20} />}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/zones')}>
            Annuler
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}