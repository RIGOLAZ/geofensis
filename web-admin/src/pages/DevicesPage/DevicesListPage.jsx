import React from 'react'
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material'

const devices = [
  { id: 'DEV001', name: 'Smartphone Ouvrier 1', status: 'online', battery: 85, lastSeen: '2 min' },
  { id: 'DEV002', name: 'Tablette Superviseur', status: 'online', battery: 62, lastSeen: '5 min' },
  { id: 'DEV003', name: 'Bracelet Sécurité 1', status: 'offline', battery: 12, lastSeen: '2h' },
]

export default function DevicesPage() {
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Devices Connectés
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Batterie</TableCell>
              <TableCell>Dernière activité</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell>{device.id}</TableCell>
                <TableCell>{device.name}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={device.status}
                    color={device.status === 'online' ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>{device.battery}%</TableCell>
                <TableCell>{device.lastSeen}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}
