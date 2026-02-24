import React from 'react'
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
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'

const zones = [
  { id: 1, name: 'Chantier Nord', type: 'polygon', alertLevel: 'high', active: true },
  { id: 2, name: 'Zone Sécurisée A', type: 'circle', alertLevel: 'medium', active: true },
  { id: 3, name: 'Entrepôt Principal', type: 'polygon', alertLevel: 'low', active: false },
]

export default function ZonesListPage() {
  const navigate = useNavigate()

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Gestion des Zones
      </Typography>
      
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
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {zones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell>{zone.name}</TableCell>
                <TableCell>{zone.type === 'circle' ? 'Cercle' : 'Polygone'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={zone.alertLevel}
                    color={zone.alertLevel === 'high' ? 'error' : zone.alertLevel === 'medium' ? 'warning' : 'success'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={zone.active ? 'Actif' : 'Inactif'}
                    color={zone.active ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}
