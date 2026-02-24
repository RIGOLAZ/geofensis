import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Button, TextField, Box, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material'

export default function ZoneCreatePage() {
  const navigate = useNavigate()
  const [zoneData, setZoneData] = useState({
    name: '',
    type: 'circle',
    alertLevel: 'medium',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Creating zone:', zoneData)
    navigate('/zones')
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Créer une Zone
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nom de la zone"
            value={zoneData.name}
            onChange={(e) => setZoneData({ ...zoneData, name: e.target.value })}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={zoneData.type}
              onChange={(e) => setZoneData({ ...zoneData, type: e.target.value })}
            >
              <MenuItem value="circle">Cercle</MenuItem>
              <MenuItem value="polygon">Polygone</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Niveau d'alerte</InputLabel>
            <Select
              value={zoneData.alertLevel}
              onChange={(e) => setZoneData({ ...zoneData, alertLevel: e.target.value })}
            >
              <MenuItem value="low">Faible</MenuItem>
              <MenuItem value="medium">Moyen</MenuItem>
              <MenuItem value="high">Critique</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" sx={{ mr: 1 }}>
              Créer
            </Button>
            <Button variant="outlined" onClick={() => navigate('/zones')}>
              Annuler
            </Button>
          </Box>
        </Box>
      </Paper>
    </div>
  )
}
