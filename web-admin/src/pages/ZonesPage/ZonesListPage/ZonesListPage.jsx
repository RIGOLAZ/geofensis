import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  CircularProgress,
  Alert
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { subscribeToZones, deleteZone } from '../../../api/zonesApi'

export default function ZonesListPage() {
  const navigate = useNavigate()
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Souscription temps réel aux zones
    const unsubscribe = subscribeToZones((updatedZones) => {
      setZones(updatedZones)
      setLoading(false)
    }, true) // activeOnly = true

    // Cleanup à la destruction du composant
    return () => unsubscribe()
  }, [])

  const handleDelete = async (zoneId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) {
      try {
        await deleteZone(zoneId)
        // La liste se mettra à jour automatiquement via onSnapshot
      } catch (err) {
        setError('Erreur lors de la suppression: ' + err.message)
      }
    }
  }

  const getAlertColor = (level) => {
    switch(level) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestion des Zones
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => navigate('/zones/create')}
        sx={{ mb: 2 }}
      >
        Nouvelle Zone
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Niveau d'alerte</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Aucune zone active. Créez votre première zone !
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell>{zone.name}</TableCell>
                  <TableCell>
                    {zone.type === 'circle' ? 'Cercle' : 'Polygone'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={zone.alertLevel?.toUpperCase() || 'MEDIUM'}
                      color={getAlertColor(zone.alertLevel)}
                    />
                  </TableCell>
                  <TableCell>{zone.description || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={zone.active ? 'Actif' : 'Inactif'}
                      color={zone.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => navigate(`/zones/edit/${zone.id}`)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDelete(zone.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}