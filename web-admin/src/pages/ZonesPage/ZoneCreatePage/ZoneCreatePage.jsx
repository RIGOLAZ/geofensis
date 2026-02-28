import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress
} from '@mui/material'
import { createZone } from '../../../api/zonesApi'
import ZoneMapEditor from '../../../components/zones/ZoneEditor/MapEditor'

const steps = ['Informations', 'Dessin sur la carte', 'Confirmation']

export default function ZoneCreatePage() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [zoneData, setZoneData] = useState({
    name: '',
    type: 'circle',
    description: '',
    alertLevel: 'medium',
    entryMessage: '',
    exitMessage: '',
    smsAlert: false,
    contactPhone: '',
    soundAlert: true,
    predictiveAlerts: true,
    // DonnÃ©es gÃ©ographiques
    center: null,
    radius: 100,
    coordinates: []
  })

  const handleNext = () => {
    if (activeStep === 0 && !zoneData.name) {
      setError('Le nom de la zone est obligatoire')
      return
    }
    if (activeStep === 1 && !zoneData.center && zoneData.coordinates.length === 0) {
      setError('Veuillez dessiner une zone sur la carte')
      return
    }
    setError(null)
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await createZone(zoneData)
      navigate('/zones')
    } catch (err) {
      setError('Erreur lors de la création: ' + err.message)
      setLoading(false)
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

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nom de la zone *"
              value={zoneData.name}
              onChange={(e) => setZoneData({ ...zoneData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={zoneData.description}
              onChange={(e) => setZoneData({ ...zoneData, description: e.target.value })}
              margin="normal"
            />
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
            <TextField
              fullWidth
              label="Message d'entrée"
              value={zoneData.entryMessage}
              onChange={(e) => setZoneData({ ...zoneData, entryMessage: e.target.value })}
              margin="normal"
              placeholder="Vous entrez dans une zone sécurisée"
            />
            <TextField
              fullWidth
              label="Message de sortie"
              value={zoneData.exitMessage}
              onChange={(e) => setZoneData({ ...zoneData, exitMessage: e.target.value })}
              margin="normal"
              placeholder="Vous quittez la zone"
            />
          </Box>
        )
      
      case 1:
        return (
          <Box sx={{ mt: 2, height: 500 }}>
            <ZoneMapEditor 
              onZoneDrawn={handleZoneDrawn}
              defaultType={zoneData.type}
            />
          </Box>
        )
      
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Récapitulatif</Typography>
            <Typography><strong>Nom:</strong> {zoneData.name}</Typography>
            <Typography><strong>Type:</strong> {zoneData.type === 'circle' ? 'Cercle' : 'Polygone'}</Typography>
            <Typography><strong>Niveau d'alerte:</strong> {zoneData.alertLevel}</Typography>
            {zoneData.center && (
              <Typography>
                <strong>Centre:</strong> {zoneData.center.lat.toFixed(6)}, {zoneData.center.lng.toFixed(6)}
              </Typography>
            )}
            {zoneData.radius && (
              <Typography><strong>Rayon:</strong> {zoneData.radius}m</Typography>
            )}
            {zoneData.coordinates.length > 0 && (
              <Typography><strong>Points:</strong> {zoneData.coordinates.length}</Typography>
            )}
          </Box>
        )
      
      default:
        return null
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Créer une Zone
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
          {activeStep > 0 && (
            <Button onClick={handleBack}>
              Retour
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Suivant
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'CrÃ©ation...' : 'CrÃ©er la zone'}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  )
}